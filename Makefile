.PHONY: gac

# Generate API client
gac:
	@echo "Generating API client..."
	@./scripts/api-client-generator.sh
