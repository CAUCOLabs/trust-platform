package auditlog

import "time"

type AuditLog struct {
	ID           int64     `json:"id"`
	EventType    string    `json:"event_type"`
	ResourceType string    `json:"resource_type"`
	ResourceID   int64     `json:"resource_id"`
	Message      string    `json:"message"`
	CreatedAt    time.Time `json:"created_at"`
}

type RecordParams struct {
	EventType    string
	ResourceType string
	ResourceID   int64
	Message      string
}
