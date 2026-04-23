package main

import (
	"context"
	"encoding/json"
	"log"
	"net/http"
	"time"

	"github.com/cauco/trust-platform/backend/internal/company"
	"github.com/cauco/trust-platform/backend/internal/config"
	"github.com/cauco/trust-platform/backend/internal/database"
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
		defer db.Close(context.Background())
	}

	mux := http.NewServeMux()

	if db != nil {
		companyRepo := company.NewRepository(db)
		companyHandler := company.NewHandler(companyRepo)

		mux.HandleFunc("POST /companies", companyHandler.CreateCompany)
		mux.HandleFunc("GET /companies", companyHandler.ListCompanies)

		verifiedNumberRepo := verifiednumber.NewRepository(db)
		verifiedNumberHandler := verifiednumber.NewHandler(verifiedNumberRepo)

		mux.HandleFunc("POST /verified-numbers", verifiedNumberHandler.CreateVerifiedNumber)
		mux.HandleFunc("GET /verified-numbers", verifiedNumberHandler.ListVerifiedNumbers)
		mux.HandleFunc("GET /lookup", verifiedNumberHandler.LookupByPhoneNumber)
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

	if err := http.ListenAndServe(addr, mux); err != nil {
		log.Fatal(err)
	}
}
