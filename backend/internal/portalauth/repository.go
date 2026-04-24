package portalauth

import (
	"context"
	"crypto/rand"
	"crypto/sha256"
	"crypto/subtle"
	"encoding/base64"
	"errors"
	"fmt"
	"strings"
	"time"

	"github.com/cauco/trust-platform/backend/internal/auditlog"
	"github.com/cauco/trust-platform/backend/internal/phone"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgconn"
	"github.com/jackc/pgx/v5/pgxpool"
)

var (
	ErrInvalidCredentials    = errors.New("invalid portal credentials")
	ErrAccountTypeMismatch   = errors.New("portal account type mismatch")
	ErrPortalSessionRequired = errors.New("portal authentication required")
	ErrEmailAlreadyUsed      = errors.New("email is already registered")
	ErrBusinessIDAlreadyUsed = errors.New("business id is already registered")
)

type Repository struct {
	db         *pgxpool.Pool
	auditRepo  *auditlog.Repository
	sessionTTL time.Duration
}

func NewRepository(db *pgxpool.Pool, auditRepo *auditlog.Repository, sessionTTL time.Duration) *Repository {
	return &Repository{
		db:         db,
		auditRepo:  auditRepo,
		sessionTTL: sessionTTL,
	}
}

func (r *Repository) SignUpPersonal(ctx context.Context, req personalSignupRequest) (Session, error) {
	ctx, cancel := context.WithTimeout(ctx, 5*time.Second)
	defer cancel()

	tx, err := r.db.BeginTx(ctx, pgx.TxOptions{})
	if err != nil {
		return Session{}, err
	}
	defer tx.Rollback(ctx)

	accountID, profile, err := r.insertAccount(ctx, tx, insertAccountParams{
		AccountType: AccountTypePersonal,
		Email:       normalizeEmail(req.Email),
		FullName:    strings.TrimSpace(req.FullName),
		PhoneNumber: phone.Normalize(req.PhoneNumber),
		Password:    req.Password,
	})
	if err != nil {
		return Session{}, err
	}

	session, err := r.createSession(ctx, tx, accountID, profile)
	if err != nil {
		return Session{}, err
	}

	if r.auditRepo != nil {
		if err := r.auditRepo.Record(ctx, tx, auditlog.RecordParams{
			EventType:    "portal_account_created",
			ResourceType: "portal_account",
			ResourceID:   accountID,
			Message:      "Personal portal account created.",
		}); err != nil {
			return Session{}, err
		}
	}

	if err := tx.Commit(ctx); err != nil {
		return Session{}, err
	}

	return session, nil
}

func (r *Repository) SignUpBusiness(ctx context.Context, req businessSignupRequest) (Session, error) {
	ctx, cancel := context.WithTimeout(ctx, 5*time.Second)
	defer cancel()

	tx, err := r.db.BeginTx(ctx, pgx.TxOptions{})
	if err != nil {
		return Session{}, err
	}
	defer tx.Rollback(ctx)

	var company CompanySummary
	err = tx.QueryRow(ctx, `
		INSERT INTO companies (name, business_id, phone_number)
		VALUES ($1, $2, $3)
		RETURNING id, name, business_id, phone_number, verified
	`, strings.TrimSpace(req.CompanyName), strings.TrimSpace(req.BusinessID), phone.Normalize(req.PhoneNumber)).Scan(
		&company.ID,
		&company.Name,
		&company.BusinessID,
		&company.PhoneNumber,
		&company.Verified,
	)
	if err != nil {
		if isUniqueViolation(err, "companies_business_id_key") {
			return Session{}, ErrBusinessIDAlreadyUsed
		}
		return Session{}, err
	}

	accountID, profile, err := r.insertAccount(ctx, tx, insertAccountParams{
		AccountType: AccountTypeBusiness,
		Email:       normalizeEmail(req.WorkEmail),
		FullName:    strings.TrimSpace(req.FullName),
		PhoneNumber: phone.Normalize(req.PhoneNumber),
		Password:    req.Password,
		CompanyID:   &company.ID,
	})
	if err != nil {
		return Session{}, err
	}

	profile.Company = &company

	session, err := r.createSession(ctx, tx, accountID, profile)
	if err != nil {
		return Session{}, err
	}

	if r.auditRepo != nil {
		if err := r.auditRepo.Record(ctx, tx, auditlog.RecordParams{
			EventType:    "portal_account_created",
			ResourceType: "portal_account",
			ResourceID:   accountID,
			Message:      "Business portal account created.",
		}); err != nil {
			return Session{}, err
		}
	}

	if err := tx.Commit(ctx); err != nil {
		return Session{}, err
	}

	return session, nil
}

func (r *Repository) SignIn(ctx context.Context, req signInRequest) (Session, error) {
	ctx, cancel := context.WithTimeout(ctx, 5*time.Second)
	defer cancel()

	tx, err := r.db.BeginTx(ctx, pgx.TxOptions{})
	if err != nil {
		return Session{}, err
	}
	defer tx.Rollback(ctx)

	var (
		accountID         int64
		accountType       string
		email             string
		fullName          string
		phoneNumber       string
		createdAt         time.Time
		salt              string
		passwordHash      string
		companyID         *int64
		companyName       *string
		companyBusinessID *string
		companyPhone      *string
		companyVerified   *bool
		numberCount       *int
		reasonCount       *int
	)

	err = tx.QueryRow(ctx, `
		SELECT
			pa.id,
			pa.account_type,
			pa.email,
			pa.full_name,
			COALESCE(pa.phone_number, ''),
			pa.created_at,
			pa.password_salt,
			pa.password_hash,
			c.id,
			c.name,
			c.business_id,
			c.phone_number,
			c.verified,
			COALESCE(vn.count, 0),
			COALESCE(cr.count, 0)
		FROM portal_accounts pa
		LEFT JOIN companies c ON c.id = pa.company_id
		LEFT JOIN (
			SELECT company_id, COUNT(*)::INT AS count
			FROM verified_numbers
			GROUP BY company_id
		) vn ON vn.company_id = c.id
		LEFT JOIN (
			SELECT company_id, COUNT(*)::INT AS count
			FROM call_reasons
			WHERE active = TRUE
			GROUP BY company_id
		) cr ON cr.company_id = c.id
		WHERE pa.email = $1
	`, normalizeEmail(req.Email)).Scan(
		&accountID,
		&accountType,
		&email,
		&fullName,
		&phoneNumber,
		&createdAt,
		&salt,
		&passwordHash,
		&companyID,
		&companyName,
		&companyBusinessID,
		&companyPhone,
		&companyVerified,
		&numberCount,
		&reasonCount,
	)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return Session{}, ErrInvalidCredentials
		}
		return Session{}, err
	}

	if accountType != req.AccountType {
		return Session{}, ErrAccountTypeMismatch
	}

	if !verifyPassword(req.Password, salt, passwordHash) {
		return Session{}, ErrInvalidCredentials
	}

	profile := Account{
		ID:          accountID,
		AccountType: accountType,
		Email:       email,
		FullName:    fullName,
		PhoneNumber: phoneNumber,
		CreatedAt:   createdAt,
	}

	if companyID != nil && companyName != nil && companyBusinessID != nil && companyPhone != nil && companyVerified != nil {
		profile.Company = &CompanySummary{
			ID:                    *companyID,
			Name:                  *companyName,
			BusinessID:            *companyBusinessID,
			PhoneNumber:           *companyPhone,
			Verified:              *companyVerified,
			VerifiedNumberCount:   derefInt(numberCount),
			ActiveCallReasonCount: derefInt(reasonCount),
		}
	}

	session, err := r.createSession(ctx, tx, accountID, profile)
	if err != nil {
		return Session{}, err
	}

	if err := tx.Commit(ctx); err != nil {
		return Session{}, err
	}

	return session, nil
}

func (r *Repository) SessionFromToken(ctx context.Context, token string) (Session, error) {
	ctx, cancel := context.WithTimeout(ctx, 5*time.Second)
	defer cancel()

	var session Session
	var companyID *int64
	var companyName, companyBusinessID, companyPhone *string
	var companyVerified *bool
	var verifiedNumberCount int
	var activeCallReasonCount int

	err := r.db.QueryRow(ctx, `
		SELECT
			ps.token,
			ps.expires_at,
			pa.id,
			pa.account_type,
			pa.email,
			pa.full_name,
			COALESCE(pa.phone_number, ''),
			pa.created_at,
			c.id,
			c.name,
			c.business_id,
			c.phone_number,
			c.verified,
			COALESCE(vn.count, 0),
			COALESCE(cr.count, 0)
		FROM portal_sessions ps
		JOIN portal_accounts pa ON pa.id = ps.account_id
		LEFT JOIN companies c ON c.id = pa.company_id
		LEFT JOIN (
			SELECT company_id, COUNT(*)::INT AS count
			FROM verified_numbers
			GROUP BY company_id
		) vn ON vn.company_id = c.id
		LEFT JOIN (
			SELECT company_id, COUNT(*)::INT AS count
			FROM call_reasons
			WHERE active = TRUE
			GROUP BY company_id
		) cr ON cr.company_id = c.id
		WHERE ps.token = $1
			AND ps.expires_at > NOW()
	`, token).Scan(
		&session.Token,
		&session.ExpiresAt,
		&session.Account.ID,
		&session.Account.AccountType,
		&session.Account.Email,
		&session.Account.FullName,
		&session.Account.PhoneNumber,
		&session.Account.CreatedAt,
		&companyID,
		&companyName,
		&companyBusinessID,
		&companyPhone,
		&companyVerified,
		&verifiedNumberCount,
		&activeCallReasonCount,
	)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			_, _ = r.db.Exec(ctx, `DELETE FROM portal_sessions WHERE token = $1`, token)
			return Session{}, ErrPortalSessionRequired
		}
		return Session{}, err
	}

	if companyID != nil && companyName != nil && companyBusinessID != nil && companyPhone != nil && companyVerified != nil {
		session.Account.Company = &CompanySummary{
			ID:                    *companyID,
			Name:                  *companyName,
			BusinessID:            *companyBusinessID,
			PhoneNumber:           *companyPhone,
			Verified:              *companyVerified,
			VerifiedNumberCount:   verifiedNumberCount,
			ActiveCallReasonCount: activeCallReasonCount,
		}
	}

	return session, nil
}

func (r *Repository) DeleteSession(ctx context.Context, token string) error {
	ctx, cancel := context.WithTimeout(ctx, 5*time.Second)
	defer cancel()

	_, err := r.db.Exec(ctx, `DELETE FROM portal_sessions WHERE token = $1`, token)
	return err
}

type insertAccountParams struct {
	AccountType string
	Email       string
	FullName    string
	PhoneNumber string
	Password    string
	CompanyID   *int64
}

func (r *Repository) insertAccount(ctx context.Context, tx pgx.Tx, params insertAccountParams) (int64, Account, error) {
	salt, hash, err := hashPassword(params.Password)
	if err != nil {
		return 0, Account{}, err
	}

	var account Account
	var companyID *int64

	err = tx.QueryRow(ctx, `
		INSERT INTO portal_accounts (
			account_type,
			email,
			full_name,
			phone_number,
			password_salt,
			password_hash,
			company_id
		)
		VALUES ($1, $2, $3, $4, $5, $6, $7)
		RETURNING id, account_type, email, full_name, phone_number, company_id, created_at
	`, params.AccountType, params.Email, params.FullName, params.PhoneNumber, salt, hash, params.CompanyID).Scan(
		&account.ID,
		&account.AccountType,
		&account.Email,
		&account.FullName,
		&account.PhoneNumber,
		&companyID,
		&account.CreatedAt,
	)
	if err != nil {
		if isUniqueViolation(err, "portal_accounts_email_key") {
			return 0, Account{}, ErrEmailAlreadyUsed
		}
		return 0, Account{}, err
	}

	return account.ID, account, nil
}

func (r *Repository) createSession(ctx context.Context, tx pgx.Tx, accountID int64, account Account) (Session, error) {
	token, err := newToken()
	if err != nil {
		return Session{}, err
	}

	expiresAt := time.Now().Add(r.sessionTTL).UTC()
	if _, err := tx.Exec(ctx, `
		INSERT INTO portal_sessions (token, account_id, expires_at)
		VALUES ($1, $2, $3)
	`, token, accountID, expiresAt); err != nil {
		return Session{}, err
	}

	return Session{
		Token:     token,
		Account:   account,
		ExpiresAt: expiresAt,
	}, nil
}

func normalizeEmail(value string) string {
	return strings.ToLower(strings.TrimSpace(value))
}

func hashPassword(password string) (string, string, error) {
	saltBytes := make([]byte, 16)
	if _, err := rand.Read(saltBytes); err != nil {
		return "", "", err
	}

	salt := base64.RawURLEncoding.EncodeToString(saltBytes)
	hash := hashWithSalt(password, salt)
	return salt, hash, nil
}

func verifyPassword(password, salt, expectedHash string) bool {
	computedHash := hashWithSalt(password, salt)
	return subtle.ConstantTimeCompare([]byte(computedHash), []byte(expectedHash)) == 1
}

func hashWithSalt(password, salt string) string {
	digest := sha256.Sum256([]byte(salt + ":" + password))
	return base64.RawURLEncoding.EncodeToString(digest[:])
}

func newToken() (string, error) {
	bytes := make([]byte, 32)
	if _, err := rand.Read(bytes); err != nil {
		return "", err
	}

	return base64.RawURLEncoding.EncodeToString(bytes), nil
}

func isUniqueViolation(err error, constraint string) bool {
	var pgErr *pgconn.PgError
	if !errors.As(err, &pgErr) {
		return false
	}

	return pgErr.Code == "23505" && pgErr.ConstraintName == constraint
}

func derefInt(value *int) int {
	if value == nil {
		return 0
	}

	return *value
}

func (r *Repository) BusinessWorkspace(ctx context.Context, companyID int64) (BusinessWorkspace, error) {
	ctx, cancel := context.WithTimeout(ctx, 5*time.Second)
	defer cancel()

	workspace := BusinessWorkspace{
		VerifiedNumbers: make([]BusinessWorkspaceVerifiedNumber, 0),
		CallReasons:     make([]BusinessWorkspaceCallReason, 0),
	}

	err := r.db.QueryRow(ctx, `
		SELECT id, name, business_id, phone_number, verified, created_at, updated_at
		FROM companies
		WHERE id = $1
	`, companyID).Scan(
		&workspace.Company.ID,
		&workspace.Company.Name,
		&workspace.Company.BusinessID,
		&workspace.Company.PhoneNumber,
		&workspace.Company.Verified,
		&workspace.Company.CreatedAt,
		&workspace.Company.UpdatedAt,
	)
	if err != nil {
		return BusinessWorkspace{}, err
	}

	numberRows, err := r.db.Query(ctx, `
		SELECT id, company_id, phone_number, label, verified, created_at
		FROM verified_numbers
		WHERE company_id = $1
		ORDER BY created_at DESC, id DESC
	`, companyID)
	if err != nil {
		return BusinessWorkspace{}, err
	}
	defer numberRows.Close()

	for numberRows.Next() {
		var item BusinessWorkspaceVerifiedNumber
		if err := numberRows.Scan(
			&item.ID,
			&item.CompanyID,
			&item.PhoneNumber,
			&item.Label,
			&item.Verified,
			&item.CreatedAt,
		); err != nil {
			return BusinessWorkspace{}, err
		}
		workspace.VerifiedNumbers = append(workspace.VerifiedNumbers, item)
	}
	if err := numberRows.Err(); err != nil {
		return BusinessWorkspace{}, err
	}

	reasonRows, err := r.db.Query(ctx, `
		SELECT id, company_id, title, description, active, priority, expires_at, created_at
		FROM call_reasons
		WHERE company_id = $1
		ORDER BY created_at DESC, id DESC
	`, companyID)
	if err != nil {
		return BusinessWorkspace{}, err
	}
	defer reasonRows.Close()

	for reasonRows.Next() {
		var item BusinessWorkspaceCallReason
		if err := reasonRows.Scan(
			&item.ID,
			&item.CompanyID,
			&item.Title,
			&item.Description,
			&item.Active,
			&item.Priority,
			&item.ExpiresAt,
			&item.CreatedAt,
		); err != nil {
			return BusinessWorkspace{}, err
		}
		workspace.CallReasons = append(workspace.CallReasons, item)
	}
	if err := reasonRows.Err(); err != nil {
		return BusinessWorkspace{}, err
	}

	return workspace, nil
}

func (r *Repository) UpdateBusinessCompany(ctx context.Context, companyID int64, req updateBusinessCompanyRequest) (BusinessWorkspaceCompany, error) {
	ctx, cancel := context.WithTimeout(ctx, 5*time.Second)
	defer cancel()

	tx, err := r.db.BeginTx(ctx, pgx.TxOptions{})
	if err != nil {
		return BusinessWorkspaceCompany{}, err
	}
	defer tx.Rollback(ctx)

	var company BusinessWorkspaceCompany
	err = tx.QueryRow(ctx, `
		UPDATE companies
		SET
			name = $2,
			business_id = $3,
			phone_number = $4,
			updated_at = NOW()
		WHERE id = $1
		RETURNING id, name, business_id, phone_number, verified, created_at, updated_at
	`, companyID, strings.TrimSpace(req.Name), strings.TrimSpace(req.BusinessID), phone.Normalize(req.PhoneNumber)).Scan(
		&company.ID,
		&company.Name,
		&company.BusinessID,
		&company.PhoneNumber,
		&company.Verified,
		&company.CreatedAt,
		&company.UpdatedAt,
	)
	if err != nil {
		return BusinessWorkspaceCompany{}, err
	}

	if r.auditRepo != nil {
		if err := r.auditRepo.Record(ctx, tx, auditlog.RecordParams{
			EventType:    "portal_company_updated",
			ResourceType: "company",
			ResourceID:   company.ID,
			Message:      "Business portal company profile updated.",
		}); err != nil {
			return BusinessWorkspaceCompany{}, err
		}
	}

	if err := tx.Commit(ctx); err != nil {
		return BusinessWorkspaceCompany{}, err
	}

	return company, nil
}

func (r *Repository) CreateBusinessVerifiedNumber(ctx context.Context, companyID int64, req createBusinessVerifiedNumberRequest) (BusinessWorkspaceVerifiedNumber, error) {
	ctx, cancel := context.WithTimeout(ctx, 5*time.Second)
	defer cancel()

	tx, err := r.db.BeginTx(ctx, pgx.TxOptions{})
	if err != nil {
		return BusinessWorkspaceVerifiedNumber{}, err
	}
	defer tx.Rollback(ctx)

	var item BusinessWorkspaceVerifiedNumber
	err = tx.QueryRow(ctx, `
		INSERT INTO verified_numbers (company_id, phone_number, label)
		VALUES ($1, $2, $3)
		RETURNING id, company_id, phone_number, label, verified, created_at
	`, companyID, phone.Normalize(req.PhoneNumber), strings.TrimSpace(req.Label)).Scan(
		&item.ID,
		&item.CompanyID,
		&item.PhoneNumber,
		&item.Label,
		&item.Verified,
		&item.CreatedAt,
	)
	if err != nil {
		return BusinessWorkspaceVerifiedNumber{}, err
	}

	if _, err := tx.Exec(ctx, `
		INSERT INTO number_signals (verified_number_id, spam_reports, lookup_count, trust_score, updated_at)
		VALUES ($1, 0, 0, 100, NOW())
		ON CONFLICT (verified_number_id) DO NOTHING
	`, item.ID); err != nil {
		return BusinessWorkspaceVerifiedNumber{}, err
	}

	if r.auditRepo != nil {
		if err := r.auditRepo.Record(ctx, tx, auditlog.RecordParams{
			EventType:    "portal_verified_number_created",
			ResourceType: "verified_number",
			ResourceID:   item.ID,
			Message:      fmt.Sprintf("Business portal trusted number %s created.", item.PhoneNumber),
		}); err != nil {
			return BusinessWorkspaceVerifiedNumber{}, err
		}
	}

	if err := tx.Commit(ctx); err != nil {
		return BusinessWorkspaceVerifiedNumber{}, err
	}

	return item, nil
}

func (r *Repository) CreateBusinessCallReason(ctx context.Context, companyID int64, req createBusinessCallReasonRequest) (BusinessWorkspaceCallReason, error) {
	ctx, cancel := context.WithTimeout(ctx, 5*time.Second)
	defer cancel()

	tx, err := r.db.BeginTx(ctx, pgx.TxOptions{})
	if err != nil {
		return BusinessWorkspaceCallReason{}, err
	}
	defer tx.Rollback(ctx)

	expiresAt, priority, err := normalizePortalCallReason(req.ExpiresAt, req.Priority)
	if err != nil {
		return BusinessWorkspaceCallReason{}, err
	}

	var item BusinessWorkspaceCallReason
	err = tx.QueryRow(ctx, `
		INSERT INTO call_reasons (company_id, title, description, priority, expires_at)
		VALUES ($1, $2, $3, $4, $5)
		RETURNING id, company_id, title, description, active, priority, expires_at, created_at
	`, companyID, strings.TrimSpace(req.Title), strings.TrimSpace(req.Description), priority, expiresAt).Scan(
		&item.ID,
		&item.CompanyID,
		&item.Title,
		&item.Description,
		&item.Active,
		&item.Priority,
		&item.ExpiresAt,
		&item.CreatedAt,
	)
	if err != nil {
		return BusinessWorkspaceCallReason{}, err
	}

	if r.auditRepo != nil {
		if err := r.auditRepo.Record(ctx, tx, auditlog.RecordParams{
			EventType:    "portal_call_reason_created",
			ResourceType: "call_reason",
			ResourceID:   item.ID,
			Message:      fmt.Sprintf("Business portal call reason %s created.", item.Title),
		}); err != nil {
			return BusinessWorkspaceCallReason{}, err
		}
	}

	if err := tx.Commit(ctx); err != nil {
		return BusinessWorkspaceCallReason{}, err
	}

	return item, nil
}

func normalizePortalCallReason(rawExpiresAt *string, rawPriority string) (*time.Time, string, error) {
	var expiresAt *time.Time
	if rawExpiresAt != nil && strings.TrimSpace(*rawExpiresAt) != "" {
		parsed, err := time.Parse(time.RFC3339, strings.TrimSpace(*rawExpiresAt))
		if err != nil {
			return nil, "", err
		}
		expiresAt = &parsed
	}

	priority := strings.TrimSpace(rawPriority)
	if priority == "" {
		priority = "normal"
	}

	return expiresAt, priority, nil
}
