#!/bin/bash

# Configuration
PROJECT_NAME="astro-blog"
VAULT_NAME="Personal"
TAG="${PROJECT_NAME}-secrets"

# List of files to manage
FILES=(
    ".env"
    ".env.production"
)

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m' # No Color

check_op_cli() {
    if ! command -v op &> /dev/null; then
        echo -e "${RED}Error: 1Password CLI (op) is not installed.${NC}"
        echo "Please install it: https://developer.1password.com/docs/cli/get-started/"
        exit 1
    fi
}

check_signin() {
    if ! op account list &> /dev/null; then
        echo -e "${RED}Error: You are not signed in to 1Password CLI.${NC}"
        echo "Please run 'op signin' first."
        exit 1
    fi
}

get_item_id() {
    local filename=$1
    op item list --tags "$TAG" --vault "$VAULT_NAME" --format json | \
    grep -B 10 "\"label\": \"$filename\"" | \
    grep "\"id\":" | head -n 1 | awk -F '"' '{print $4}'
}

save_secrets() {
    echo "Saving secrets to 1Password (Vault: $VAULT_NAME, Tag: $TAG)..."
    
    for file in "${FILES[@]}"; do
        if [ -f "$file" ]; then
            echo -n "Processing $file... "
            
            # Check if item exists
            ITEM_ID=$(get_item_id "$file")
            
            if [ -n "$ITEM_ID" ]; then
                # Update existing item
                op item edit "$ITEM_ID" "file[1]=./$file" --vault "$VAULT_NAME" > /dev/null
                echo -e "${GREEN}Updated${NC}"
            else
                # Create new item
                op document create "./$file" \
                    --tags "$TAG" \
                    --title "$file" \
                    --vault "$VAULT_NAME" > /dev/null
                echo -e "${GREEN}Created${NC}"
            fi
        else
            echo "Skipped (not found locally)"
        fi
    done
    echo "Done."
}

restore_secrets() {
    echo "Restoring secrets from 1Password..."
    
    # Get all items with the tag
    ITEMS=$(op item list --tags "$TAG" --vault "$VAULT_NAME" --format json)
    
    # Check if we found any items
    if [ "$ITEMS" == "[]" ]; then
        echo "No secrets found with tag '$TAG' in vault '$VAULT_NAME'."
        return
    fi
    
    for file in "${FILES[@]}"; do
        echo -n "Looking for $file... "
        
        # Extract ID for the specific file
        ITEM_ID=$(echo "$ITEMS" | grep -B 10 "\"label\": \"$file\"" | grep "\"id\":" | head -n 1 | awk -F '"' '{print $4}')
        
        if [ -n "$ITEM_ID" ]; then
            # Check if file exists locally
            if [ -f "$file" ]; then
                # Create backup
                cp "$file" "${file}.bak"
            fi
            
            op document get "$ITEM_ID" --output "$file" --vault "$VAULT_NAME"
            echo -e "${GREEN}Restored${NC}"
        else
            echo "Not found in 1Password"
        fi
    done
    echo "Done."
}

# Main execution
check_op_cli
check_signin

case "$1" in
    save)
        save_secrets
        ;;
    restore)
        restore_secrets
        ;;
    *)
        echo "Usage: $0 {save|restore}"
        exit 1
        ;;
esac

