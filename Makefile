.PHONY: dev help

# Default target
help:
	@echo "Resume Builder Development Commands"
	@echo ""
	@echo "Quick Start:"
	@echo "  make dev              - Run development servers"
	@echo ""
	@echo "Note: Redis is now hosted on Upstash (no local service needed)"
	@echo ""

# Development command - runs npm dev
dev:
	@echo "Starting development servers..."
	@npm run dev:all
