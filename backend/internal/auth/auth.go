package auth

import (
	"crypto/rand"
	"crypto/subtle"
	"encoding/base64"
	"encoding/json"
	"net/http"
	"strings"
	"sync"
	"time"
)

type AdminSession struct {
	Username  string    `json:"username"`
	Role      string    `json:"role"`
	ExpiresAt time.Time `json:"expires_at"`
}

type Service struct {
	adminUsername string
	adminPassword string
	sessionTTL    time.Duration
	sessions      map[string]AdminSession
	mu            sync.RWMutex
}

type LoginRequest struct {
	Username string `json:"username"`
	Password string `json:"password"`
}

type LoginResponse struct {
	Token     string       `json:"token"`
	Session   AdminSession `json:"session"`
	ExpiresAt time.Time    `json:"expires_at"`
}

func NewService(adminUsername string, adminPassword string, sessionTTL time.Duration) *Service {
	return &Service{
		adminUsername: adminUsername,
		adminPassword: adminPassword,
		sessionTTL:    sessionTTL,
		sessions:      make(map[string]AdminSession),
	}
}

func (s *Service) Login(w http.ResponseWriter, r *http.Request) {
	var req LoginRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "invalid json body", http.StatusBadRequest)
		return
	}

	if !s.credentialsMatch(req.Username, req.Password) {
		http.Error(w, "invalid admin credentials", http.StatusUnauthorized)
		return
	}

	token, err := newToken()
	if err != nil {
		http.Error(w, "failed to create session", http.StatusInternalServerError)
		return
	}

	session := AdminSession{
		Username:  s.adminUsername,
		Role:      "admin",
		ExpiresAt: time.Now().Add(s.sessionTTL).UTC(),
	}

	s.mu.Lock()
	s.sessions[token] = session
	s.mu.Unlock()

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	_ = json.NewEncoder(w).Encode(LoginResponse{
		Token:     token,
		Session:   session,
		ExpiresAt: session.ExpiresAt,
	})
}

func (s *Service) Me(w http.ResponseWriter, r *http.Request) {
	session, ok := s.sessionFromRequest(r)
	if !ok {
		http.Error(w, "admin authentication required", http.StatusUnauthorized)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	_ = json.NewEncoder(w).Encode(session)
}

func (s *Service) Logout(w http.ResponseWriter, r *http.Request) {
	token, ok := bearerToken(r)
	if ok {
		s.mu.Lock()
		delete(s.sessions, token)
		s.mu.Unlock()
	}

	w.WriteHeader(http.StatusNoContent)
}

func (s *Service) RequireAdmin(next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if _, ok := s.sessionFromRequest(r); !ok {
			http.Error(w, "admin authentication required", http.StatusUnauthorized)
			return
		}

		next(w, r)
	}
}

func (s *Service) sessionFromRequest(r *http.Request) (AdminSession, bool) {
	token, ok := bearerToken(r)
	if !ok {
		return AdminSession{}, false
	}

	s.mu.RLock()
	session, exists := s.sessions[token]
	s.mu.RUnlock()

	if !exists {
		return AdminSession{}, false
	}

	if time.Now().After(session.ExpiresAt) {
		s.mu.Lock()
		delete(s.sessions, token)
		s.mu.Unlock()
		return AdminSession{}, false
	}

	return session, true
}

func (s *Service) credentialsMatch(username string, password string) bool {
	usernameMatch := subtle.ConstantTimeCompare([]byte(username), []byte(s.adminUsername)) == 1
	passwordMatch := subtle.ConstantTimeCompare([]byte(password), []byte(s.adminPassword)) == 1
	return usernameMatch && passwordMatch
}

func bearerToken(r *http.Request) (string, bool) {
	value := r.Header.Get("Authorization")
	if value == "" {
		return "", false
	}

	token, ok := strings.CutPrefix(value, "Bearer ")
	if !ok || strings.TrimSpace(token) == "" {
		return "", false
	}

	return token, true
}

func newToken() (string, error) {
	bytes := make([]byte, 32)
	if _, err := rand.Read(bytes); err != nil {
		return "", err
	}

	return base64.RawURLEncoding.EncodeToString(bytes), nil
}
