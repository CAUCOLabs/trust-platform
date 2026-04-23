package callcard

import (
	"encoding/json"
	"net/http"
)

type Handler struct {
	repo *Repository
}

func NewHandler(repo *Repository) *Handler {
	return &Handler{repo: repo}
}

func (h *Handler) GetCallCard(w http.ResponseWriter, r *http.Request) {
	phoneNumber := r.URL.Query().Get("phone_number")
	if phoneNumber == "" {
		http.Error(w, "phone_number is required", http.StatusBadRequest)
		return
	}

	resp, err := h.repo.Build(r.Context(), phoneNumber)
	if err != nil {
		http.Error(w, "failed to build call card", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	_ = json.NewEncoder(w).Encode(resp)
}
