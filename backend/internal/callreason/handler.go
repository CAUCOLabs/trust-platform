package callreason

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

func (h *Handler) CreateCallReason(w http.ResponseWriter, r *http.Request) {
	var req CreateCallReasonRequest

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "invalid json body", http.StatusBadRequest)
		return
	}

	if req.CompanyID == 0 || req.Title == "" || req.Description == "" {
		http.Error(w, "company_id, title and description are required", http.StatusBadRequest)
		return
	}

	item, err := h.repo.Create(r.Context(), req)
	if err != nil {
		http.Error(w, "failed to create call reason", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	_ = json.NewEncoder(w).Encode(item)
}

func (h *Handler) ListCallReasons(w http.ResponseWriter, r *http.Request) {
	items, err := h.repo.List(r.Context())
	if err != nil {
		http.Error(w, "failed to list call reasons", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	_ = json.NewEncoder(w).Encode(items)
}

func (h *Handler) UpdateCallReason(w http.ResponseWriter, r *http.Request) {
	id, err := strconv.ParseInt(r.PathValue("id"), 10, 64)
	if err != nil || id <= 0 {
		http.Error(w, "invalid call reason id", http.StatusBadRequest)
		return
	}

	var req UpdateCallReasonRequest

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "invalid json body", http.StatusBadRequest)
		return
	}

	if req.CompanyID == 0 || req.Title == "" || req.Description == "" {
		http.Error(w, "company_id, title and description are required", http.StatusBadRequest)
		return
	}

	item, err := h.repo.Update(r.Context(), id, req)
	if err != nil {
		if err == pgx.ErrNoRows {
			http.Error(w, "call reason not found", http.StatusNotFound)
			return
		}
		http.Error(w, "failed to update call reason", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	_ = json.NewEncoder(w).Encode(item)
}

func (h *Handler) DeleteCallReason(w http.ResponseWriter, r *http.Request) {
	id, err := strconv.ParseInt(r.PathValue("id"), 10, 64)
	if err != nil || id <= 0 {
		http.Error(w, "invalid call reason id", http.StatusBadRequest)
		return
	}

	err = h.repo.Delete(r.Context(), id)
	if err != nil {
		if err == pgx.ErrNoRows {
			http.Error(w, "call reason not found", http.StatusNotFound)
			return
		}
		http.Error(w, "failed to delete call reason", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}
