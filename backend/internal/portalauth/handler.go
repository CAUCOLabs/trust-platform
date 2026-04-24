package portalauth

import (
	"encoding/json"
	"errors"
	"net/http"
	"strings"
)

type Handler struct {
	repo *Repository
}

func NewHandler(repo *Repository) *Handler {
	return &Handler{repo: repo}
}

func (h *Handler) SignUpPersonal(w http.ResponseWriter, r *http.Request) {
	var req personalSignupRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "invalid json body", http.StatusBadRequest)
		return
	}

	if strings.TrimSpace(req.FullName) == "" || normalizeEmail(req.Email) == "" || strings.TrimSpace(req.PhoneNumber) == "" || len(req.Password) < 8 {
		http.Error(w, "full_name, email, phone_number and password (min 8 chars) are required", http.StatusBadRequest)
		return
	}

	session, err := h.repo.SignUpPersonal(r.Context(), req)
	if err != nil {
		switch {
		case errors.Is(err, ErrEmailAlreadyUsed):
			http.Error(w, err.Error(), http.StatusConflict)
		default:
			http.Error(w, "failed to create personal account", http.StatusInternalServerError)
		}
		return
	}

	writeJSON(w, http.StatusCreated, session)
}

func (h *Handler) SignUpBusiness(w http.ResponseWriter, r *http.Request) {
	var req businessSignupRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "invalid json body", http.StatusBadRequest)
		return
	}

	if strings.TrimSpace(req.FullName) == "" ||
		normalizeEmail(req.WorkEmail) == "" ||
		len(req.Password) < 8 ||
		strings.TrimSpace(req.CompanyName) == "" ||
		strings.TrimSpace(req.BusinessID) == "" ||
		strings.TrimSpace(req.PhoneNumber) == "" {
		http.Error(w, "full_name, work_email, password, company_name, business_id and phone_number are required", http.StatusBadRequest)
		return
	}

	session, err := h.repo.SignUpBusiness(r.Context(), req)
	if err != nil {
		switch {
		case errors.Is(err, ErrEmailAlreadyUsed), errors.Is(err, ErrBusinessIDAlreadyUsed):
			http.Error(w, err.Error(), http.StatusConflict)
		default:
			http.Error(w, "failed to create business account", http.StatusInternalServerError)
		}
		return
	}

	writeJSON(w, http.StatusCreated, session)
}

func (h *Handler) SignIn(w http.ResponseWriter, r *http.Request) {
	var req signInRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "invalid json body", http.StatusBadRequest)
		return
	}

	if req.AccountType != AccountTypePersonal && req.AccountType != AccountTypeBusiness {
		http.Error(w, "account_type must be personal or business", http.StatusBadRequest)
		return
	}

	if normalizeEmail(req.Email) == "" || req.Password == "" {
		http.Error(w, "email and password are required", http.StatusBadRequest)
		return
	}

	session, err := h.repo.SignIn(r.Context(), req)
	if err != nil {
		switch {
		case errors.Is(err, ErrInvalidCredentials), errors.Is(err, ErrAccountTypeMismatch):
			http.Error(w, "invalid portal credentials", http.StatusUnauthorized)
		default:
			http.Error(w, "failed to sign in", http.StatusInternalServerError)
		}
		return
	}

	writeJSON(w, http.StatusOK, session)
}

func (h *Handler) Me(w http.ResponseWriter, r *http.Request) {
	session, err := h.sessionFromRequest(r)
	if err != nil {
		http.Error(w, "portal authentication required", http.StatusUnauthorized)
		return
	}

	writeJSON(w, http.StatusOK, session)
}

func (h *Handler) Logout(w http.ResponseWriter, r *http.Request) {
	token, ok := bearerToken(r)
	if ok {
		_ = h.repo.DeleteSession(r.Context(), token)
	}

	w.WriteHeader(http.StatusNoContent)
}

func (h *Handler) BusinessWorkspace(w http.ResponseWriter, r *http.Request) {
	session, companyID, ok := h.requireBusinessAccount(w, r)
	if !ok {
		return
	}

	workspace, err := h.repo.BusinessWorkspace(r.Context(), companyID)
	if err != nil {
		http.Error(w, "failed to load business workspace", http.StatusInternalServerError)
		return
	}

	if workspace.Company.ID == 0 && session.Account.Company != nil {
		http.Error(w, "business workspace not found", http.StatusNotFound)
		return
	}

	writeJSON(w, http.StatusOK, workspace)
}

func (h *Handler) UpdateBusinessCompany(w http.ResponseWriter, r *http.Request) {
	_, companyID, ok := h.requireBusinessAccount(w, r)
	if !ok {
		return
	}

	var req updateBusinessCompanyRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "invalid json body", http.StatusBadRequest)
		return
	}

	if strings.TrimSpace(req.Name) == "" || strings.TrimSpace(req.BusinessID) == "" || strings.TrimSpace(req.PhoneNumber) == "" {
		http.Error(w, "name, business_id and phone_number are required", http.StatusBadRequest)
		return
	}

	company, err := h.repo.UpdateBusinessCompany(r.Context(), companyID, req)
	if err != nil {
		http.Error(w, "failed to update business company", http.StatusInternalServerError)
		return
	}

	writeJSON(w, http.StatusOK, company)
}

func (h *Handler) CreateBusinessVerifiedNumber(w http.ResponseWriter, r *http.Request) {
	_, companyID, ok := h.requireBusinessAccount(w, r)
	if !ok {
		return
	}

	var req createBusinessVerifiedNumberRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "invalid json body", http.StatusBadRequest)
		return
	}

	if strings.TrimSpace(req.PhoneNumber) == "" || strings.TrimSpace(req.Label) == "" {
		http.Error(w, "phone_number and label are required", http.StatusBadRequest)
		return
	}

	item, err := h.repo.CreateBusinessVerifiedNumber(r.Context(), companyID, req)
	if err != nil {
		http.Error(w, "failed to create trusted number", http.StatusInternalServerError)
		return
	}

	writeJSON(w, http.StatusCreated, item)
}

func (h *Handler) CreateBusinessCallReason(w http.ResponseWriter, r *http.Request) {
	_, companyID, ok := h.requireBusinessAccount(w, r)
	if !ok {
		return
	}

	var req createBusinessCallReasonRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "invalid json body", http.StatusBadRequest)
		return
	}

	if strings.TrimSpace(req.Title) == "" || strings.TrimSpace(req.Description) == "" {
		http.Error(w, "title and description are required", http.StatusBadRequest)
		return
	}

	item, err := h.repo.CreateBusinessCallReason(r.Context(), companyID, req)
	if err != nil {
		http.Error(w, "failed to create call reason", http.StatusInternalServerError)
		return
	}

	writeJSON(w, http.StatusCreated, item)
}

func (h *Handler) RequirePortal(next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if _, err := h.sessionFromRequest(r); err != nil {
			http.Error(w, "portal authentication required", http.StatusUnauthorized)
			return
		}

		next(w, r)
	}
}

func (h *Handler) sessionFromRequest(r *http.Request) (Session, error) {
	token, ok := bearerToken(r)
	if !ok {
		return Session{}, ErrPortalSessionRequired
	}

	return h.repo.SessionFromToken(r.Context(), token)
}

func bearerToken(r *http.Request) (string, bool) {
	value := r.Header.Get("Authorization")
	token, ok := strings.CutPrefix(value, "Bearer ")
	if !ok || strings.TrimSpace(token) == "" {
		return "", false
	}

	return token, true
}

func writeJSON(w http.ResponseWriter, status int, payload any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(payload)
}

func (h *Handler) requireBusinessAccount(w http.ResponseWriter, r *http.Request) (Session, int64, bool) {
	session, err := h.sessionFromRequest(r)
	if err != nil {
		http.Error(w, "portal authentication required", http.StatusUnauthorized)
		return Session{}, 0, false
	}

	if session.Account.AccountType != AccountTypeBusiness || session.Account.Company == nil || session.Account.Company.ID <= 0 {
		http.Error(w, "business portal access required", http.StatusForbidden)
		return Session{}, 0, false
	}

	return session, session.Account.Company.ID, true
}
