#!/bin/bash

# Vytvořit .env.example soubor, pokud ještě neexistuje
mkdir -p backend
cat > backend/.env.example << EOF
# OpenAI API klíč
OPENAI_API_KEY=VAS_OPENAI_API_KLIC

# Port, na kterém běží server
PORT=3000
EOF

# Odstranit .env soubor z historie
git filter-branch --force --index-filter "git rm --cached --ignore-unmatch backend/.env" --prune-empty --tag-name-filter cat -- --all

# Pokud máme .env soubor lokálně, nastavíme ho jako ignorovaný, ale zachováme ho
if [ -f backend/.env ]; then
  git update-index --skip-worktree backend/.env
fi

echo "Repozitář vyčištěn od API klíče. Nyní můžete zkusit push na GitHub" 