#!/bin/bash
echo "🔄 Syncing Anchor IDL to frontend and backend..."

mkdir -p apps/frontend/lib/idl apps/backend/src/services/idl

if [ -f "programs/koshai-core/target/idl/koshai_core.json" ]; then
  cp programs/koshai-core/target/idl/koshai_core.json apps/frontend/lib/idl/
  cp programs/koshai-core/target/idl/koshai_core.json apps/backend/src/services/idl/
  echo "✅ IDL copied successfully!"
else
  echo "⚠️  No IDL found yet. Run 'pnpm run build:programs' after creating the program."
fi
