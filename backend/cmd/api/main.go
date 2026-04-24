package main

import (
	"context"
	"encoding/json"
	"log"
	"net/http"
	"time"

	"github.com/cauco/trust-platform/backend/internal/auditlog"
	"github.com/cauco/trust-platform/backend/internal/auth"
	"github.com/cauco/trust-platform/backend/internal/callcard"
	"github.com/cauco/trust-platform/backend/internal/callreason"
	"github.com/cauco/trust-platform/backend/internal/callsession"
	"github.com/cauco/trust-platform/backend/internal/company"
	"github.com/cauco/trust-platform/backend/internal/config"
	"github.com/cauco/trust-platform/backend/internal/database"
	"github.com/cauco/trust-platform/backend/internal/portalauth"
	"github.com/cauco/trust-platform/backend/internal/verifiednumber"
)

type HealthResponse struct {
	Status   string `json:"status"`
	Database string `json:"database"`
}

func main() {
	cfg := config.Load()

	db, err := database.Connect(cfg)
	if err != nil {
		log.Printf("database connection failed: %v", err)
	} else {
		log.Println("database connected")
		if err := database.ApplyMigrations(db); err != nil {
			log.Fatalf("failed to apply migrations: %v", err)
		}
		defer db.Close()
	}

	mux := http.NewServeMux()
	authService := auth.NewService(cfg.AdminUsername, cfg.AdminPassword, 12*time.Hour)

	mux.HandleFunc("POST /admin/auth/login", authService.Login)
	mux.HandleFunc("GET /admin/auth/me", authService.RequireAdmin(authService.Me))
	mux.HandleFunc("POST /admin/auth/logout", authService.RequireAdmin(authService.Logout))

	if db != nil {
		auditLogRepo := auditlog.NewRepository(db)
		auditLogHandler := auditlog.NewHandler(auditLogRepo)
		portalAuthRepo := portalauth.NewRepository(db, auditLogRepo, 14*24*time.Hour)
		portalAuthHandler := portalauth.NewHandler(portalAuthRepo)

		mux.HandleFunc("POST /portal/auth/signup/personal", portalAuthHandler.SignUpPersonal)
		mux.HandleFunc("POST /portal/auth/signup/business", portalAuthHandler.SignUpBusiness)
		mux.HandleFunc("POST /portal/auth/login", portalAuthHandler.SignIn)
		mux.HandleFunc("GET /portal/auth/me", portalAuthHandler.RequirePortal(portalAuthHandler.Me))
		mux.HandleFunc("POST /portal/auth/logout", portalAuthHandler.RequirePortal(portalAuthHandler.Logout))
		mux.HandleFunc("GET /portal/business/workspace", portalAuthHandler.RequirePortal(portalAuthHandler.BusinessWorkspace))
		mux.HandleFunc("PUT /portal/business/company", portalAuthHandler.RequirePortal(portalAuthHandler.UpdateBusinessCompany))
		mux.HandleFunc("POST /portal/business/verified-numbers", portalAuthHandler.RequirePortal(portalAuthHandler.CreateBusinessVerifiedNumber))
		mux.HandleFunc("POST /portal/business/call-reasons", portalAuthHandler.RequirePortal(portalAuthHandler.CreateBusinessCallReason))

		companyRepo := company.NewRepository(db, auditLogRepo)
		companyHandler := company.NewHandler(companyRepo)

		mux.HandleFunc("POST /companies", authService.RequireAdmin(companyHandler.CreateCompany))
		mux.HandleFunc("GET /companies", authService.RequireAdmin(companyHandler.ListCompanies))
		mux.HandleFunc("PUT /companies/{id}", authService.RequireAdmin(companyHandler.UpdateCompany))
		mux.HandleFunc("DELETE /companies/{id}", authService.RequireAdmin(companyHandler.DeleteCompany))

		callSessionRepo := callsession.NewRepository(db, auditLogRepo)
		callSessionHandler := callsession.NewHandler(callSessionRepo)

		mux.HandleFunc("POST /call-sessions", authService.RequireAdmin(callSessionHandler.CreateCallSession))
		mux.HandleFunc("GET /call-sessions", authService.RequireAdmin(callSessionHandler.ListCallSessions))
		mux.HandleFunc("GET /audit-logs", authService.RequireAdmin(auditLogHandler.ListAuditLogs))

		verifiedNumberRepo := verifiednumber.NewRepository(db, auditLogRepo, callSessionRepo)
		verifiedNumberHandler := verifiednumber.NewHandler(verifiedNumberRepo)

		mux.HandleFunc("POST /verified-numbers", authService.RequireAdmin(verifiedNumberHandler.CreateVerifiedNumber))
		mux.HandleFunc("GET /verified-numbers", authService.RequireAdmin(verifiedNumberHandler.ListVerifiedNumbers))
		mux.HandleFunc("PUT /verified-numbers/{id}", authService.RequireAdmin(verifiedNumberHandler.UpdateVerifiedNumber))
		mux.HandleFunc("DELETE /verified-numbers/{id}", authService.RequireAdmin(verifiedNumberHandler.DeleteVerifiedNumber))
		mux.HandleFunc("GET /lookup", verifiedNumberHandler.LookupByPhoneNumber)
		mux.HandleFunc("POST /report-spam", verifiedNumberHandler.ReportSpam)

		callReasonRepo := callreason.NewRepository(db, auditLogRepo)
		callReasonHandler := callreason.NewHandler(callReasonRepo)

		mux.HandleFunc("POST /call-reasons", authService.RequireAdmin(callReasonHandler.CreateCallReason))
		mux.HandleFunc("GET /call-reasons", authService.RequireAdmin(callReasonHandler.ListCallReasons))
		mux.HandleFunc("PUT /call-reasons/{id}", authService.RequireAdmin(callReasonHandler.UpdateCallReason))
		mux.HandleFunc("DELETE /call-reasons/{id}", authService.RequireAdmin(callReasonHandler.DeleteCallReason))

		callCardRepo := callcard.NewRepository(verifiedNumberRepo)
		callCardHandler := callcard.NewHandler(callCardRepo)

		mux.HandleFunc("GET /call-card", callCardHandler.GetCallCard)
	}

	mux.HandleFunc("/health", func(w http.ResponseWriter, r *http.Request) {
		response := HealthResponse{
			Status:   "ok",
			Database: "down",
		}

		if db != nil {
			ctx, cancel := context.WithTimeout(context.Background(), 2*time.Second)
			defer cancel()

			if err := db.Ping(ctx); err == nil {
				response.Database = "up"
			}
		}

		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusOK)
		_ = json.NewEncoder(w).Encode(response)
	})

	addr := ":" + cfg.AppPort
	log.Printf("API running on %s", addr)

	handler := withCORS(mux)

	if err := http.ListenAndServe(addr, handler); err != nil {
		log.Fatal(err)
	}
}

func withCORS(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		origin := r.Header.Get("Origin")
		if isAllowedLocalOrigin(origin) {
			w.Header().Set("Access-Control-Allow-Origin", origin)
		}

		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Authorization, Content-Type")

		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusNoContent)
			return
		}

		next.ServeHTTP(w, r)
	})
}

func isAllowedLocalOrigin(origin string) bool {
	switch origin {
	case "http://localhost:5500",
		"http://localhost:5173",
		"http://localhost:5174",
		"http://127.0.0.1:5173",
		"http://127.0.0.1:5174":
		return true
	default:
		return false
	}
}
