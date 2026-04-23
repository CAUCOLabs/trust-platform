package company

import (
	"encoding/json"
	"net/http"
	"strconv"

	"github.com/jackc/pgx/v5"
)

type Handler struct {
	repo *Repository
}

func NewHandler(repo *Repository) *Handler {
	return &Handler{repo: repo}
}

func (h *Handler) CreateCompany(w http.ResponseWriter, r *http.Request) {
	var req CreateCompanyRequest

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "invalid json body", http.StatusBadRequest)
		return
	}

	if req.Name == "" || req.BusinessID == "" || req.PhoneNumber == "" {
		http.Error(w, "name, business_id and phone_number are required", http.StatusBadRequest)
		return
	}

	company, err := h.repo.Create(r.Context(), req)
	if err != nil {
		http.Error(w, "failed to create company", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	_ = json.NewEncoder(w).Encode(company)
}

func (h *Handler) ListCompanies(w http.ResponseWriter, r *http.Request) {
	companies, err := h.repo.List(r.Context())
	if err != nil {
		http.Error(w, "failed to list companies", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	_ = json.NewEncoder(w).Encode(companies)
}

func (h *Handler) UpdateCompany(w http.ResponseWriter, r *http.Request) {
	id, err := strconv.ParseInt(r.PathValue("id"), 10, 64)
	if err != nil || id <= 0 {
		http.Error(w, "invalid company id", http.StatusBadRequest)
		return
	}

	var req UpdateCompanyRequest

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "invalid json body", http.StatusBadRequest)
		return
	}

	if req.Name == "" || req.BusinessID == "" || req.PhoneNumber == "" {
		http.Error(w, "name, business_id and phone_number are required", http.StatusBadRequest)
		return
	}

	company, err := h.repo.Update(r.Context(), id, req)
	if err != nil {
		if err == pgx.ErrNoRows {
			http.Error(w, "company not found", http.StatusNotFound)
			return
		}
		http.Error(w, "failed to update company", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	_ = json.NewEncoder(w).Encode(company)
}

func (h *Handler) DeleteCompany(w http.ResponseWriter, r *http.Request) {
	id, err := strconv.ParseInt(r.PathValue("id"), 10, 64)
	if err != nil || id <= 0 {
		http.Error(w, "invalid company id", http.StatusBadRequest)
		return
	}

	err = h.repo.Delete(r.Context(), id)
	if err != nil {
		if err == pgx.ErrNoRows {
			http.Error(w, "company not found", http.StatusNotFound)
			return
		}
		http.Error(w, "failed to delete company", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}
