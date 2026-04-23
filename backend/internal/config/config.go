package config

import (
	"log"
	"os"

	"github.com/joho/godotenv"
)

type Config struct {
	AppEnv        string
	AppPort       string
	DBHost        string
	DBPort        string
	DBName        string
	DBUser        string
	DBPassword    string
	RedisHost     string
	RedisPort     string
	AdminUsername string
	AdminPassword string
}

func Load() Config {
	_ = godotenv.Load("../.env")
	_ = godotenv.Load(".env")

	cfg := Config{
		AppEnv:        getEnv("APP_ENV", "development"),
		AppPort:       getEnv("APP_PORT", "8080"),
		DBHost:        getEnv("DB_HOST", "localhost"),
		DBPort:        getEnv("DB_PORT", "5432"),
		DBName:        getEnv("DB_NAME", "trust_platform"),
		DBUser:        getEnv("DB_USER", "trust_user"),
		DBPassword:    getEnv("DB_PASSWORD", "trust_password"),
		RedisHost:     getEnv("REDIS_HOST", "localhost"),
		RedisPort:     getEnv("REDIS_PORT", "6379"),
		AdminUsername: getEnv("ADMIN_USERNAME", "admin@trust.local"),
		AdminPassword: getEnv("ADMIN_PASSWORD", "trust-admin"),
	}

	log.Printf("config loaded: env=%s port=%s", cfg.AppEnv, cfg.AppPort)
	return cfg
}

func getEnv(key, fallback string) string {
	value := os.Getenv(key)
	if value == "" {
		return fallback
	}
	return value
}
