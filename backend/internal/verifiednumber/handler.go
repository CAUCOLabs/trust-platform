package verifiednumber

import (
	"encoding/json"
	"log"
	"net/http"
	"strconv"

	"github.com/jackc/pgx/v5"
)

type Handler struct {
	repo *Repository
}

type ReportSpamRequest struct {
	PhoneNumber string `json:"phone_number"`
}

func NewHandler(repo *Repository) *Handler {
	return &Handler{repo: repo}
}

func (h *Handler) CreateVerifiedNumber(w http.ResponseWriter, r *http.Request) {
	var req CreateVerifiedNumberRequest

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "invalid json body", http.StatusBadRequest)
		return
	}

	if req.CompanyID == 0 || req.PhoneNumber == "" || req.Label == "" {
		http.Error(w, "company_id, phone_number and label are required", http.StatusBadRequest)
		return
	}

	item, err := h.repo.Create(r.Context(), req)
	if err != nil {
		http.Error(w, "failed to create verified number", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	_ = json.NewEncoder(w).Encode(item)
}

func (h *Handler) ListVerifiedNumbers(w http.ResponseWriter, r *http.Request) {
	items, err := h.repo.List(r.Context())
	if err != nil {
		http.Error(w, "failed to list verified numbers", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	_ = json.NewEncoder(w).Encode(items)
}

func (h *Handler) UpdateVerifiedNumber(w http.ResponseWriter, r *http.Request) {
	id, err := strconv.ParseInt(r.PathValue("id"), 10, 64)
	if err != nil || id <= 0 {
		http.Error(w, "invalid verified number id", http.StatusBadRequest)
		return
	}

	var req UpdateVerifiedNumberRequest

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "invalid json body", http.StatusBadRequest)
		return
	}

	if req.CompanyID == 0 || req.PhoneNumber == "" || req.Label == "" {
		http.Error(w, "company_id, phone_number and label are required", http.StatusBadRequest)
		return
	}

	item, err := h.repo.Update(r.Context(), id, req)
	if err != nil {
		if err == pgx.ErrNoRows {
			http.Error(w, "verified number not found", http.StatusNotFound)
			return
		}
		http.Error(w, "failed to update verified number", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	_ = json.NewEncoder(w).Encode(item)
}

func (h *Handler) DeleteVerifiedNumber(w http.ResponseWriter, r *http.Request) {
	id, err := strconv.ParseInt(r.PathValue("id"), 10, 64)
	if err != nil || id <= 0 {
		http.Error(w, "invalid verified number id", http.StatusBadRequest)
		return
	}

	err = h.repo.Delete(r.Context(), id)
	if err != nil {
		if err == pgx.ErrNoRows {
			http.Error(w, "verified number not found", http.StatusNotFound)
			return
		}
		http.Error(w, "failed to delete verified number", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

func (h *Handler) LookupByPhoneNumber(w http.ResponseWriter, r *http.Request) {
	phoneNumber := r.URL.Query().Get("phone_number")
	if phoneNumber == "" {
		http.Error(w, "phone_number is required", http.StatusBadRequest)
		return
	}

	result, err := h.repo.LookupByPhoneNumber(r.Context(), phoneNumber)
	if err != nil {
		log.Printf("lookup failed for phone_number=%q: %v", phoneNumber, err)
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	_ = json.NewEncoder(w).Encode(result)
}

func (h *Handler) ReportSpam(w http.ResponseWriter, r *http.Request) {
	var req ReportSpamRequest

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "invalid json body", http.StatusBadRequest)
		return
	}

	if req.PhoneNumber == "" {
		http.Error(w, "phone_number is required", http.StatusBadRequest)
		return
	}

	err := h.repo.ReportSpam(r.Context(), req.PhoneNumber)
	if err != nil {
		http.Error(w, "failed to report spam", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}
