#!/bin/bash
echo "🔄 Syncing Anchor IDL to frontend and backend..."

mkdir -p apps/frontend/lib/idl
mkdir -p apps/frontend/lib/types
mkdir -p apps/backend/src/idl
mkdir -p apps/backend/src/types

# Sync trezo-core
if [ -f "target/idl/trezo_core.json" ]; then
  cp target/idl/trezo_core.json apps/frontend/lib/idl/trezo_core.json
  cp target/idl/trezo_core.json apps/backend/src/idl/trezo_core.json
  echo "✅ trezo-core IDL copied"
else
  echo "⚠️  trezo-core IDL not found — run anchor build first"
fi

# Sync trezo-core types
if [ -f "target/types/trezo_core.ts" ]; then
  cp target/types/trezo_core.ts apps/frontend/lib/types/trezo_core.ts
  cp target/types/trezo_core.ts apps/backend/src/types/trezo_core.ts
  echo "✅ trezo-core types copied"
else
  echo "⚠️  trezo-core types not found"
fi

# Sync trezo-hook
if [ -f "target/idl/trezo_hook.json" ]; then
  cp target/idl/trezo_hook.json apps/frontend/lib/idl/trezo_hook.json
  cp target/idl/trezo_hook.json apps/backend/src/idl/trezo_hook.json
  echo "✅ trezo-hook IDL copied"
else
  echo "⚠️  trezo-hook IDL not found"
fi

# Sync trezo-hook types
if [ -f "target/types/trezo_hook.ts" ]; then
  cp target/types/trezo_hook.ts apps/frontend/lib/types/trezo_hook.ts
  cp target/types/trezo_hook.ts apps/backend/src/types/trezo_hook.ts
  echo "✅ trezo-hook types copied"
else
  echo "⚠️  trezo-hook types not found"
fi

echo ""
echo "📦 Programs synced:"
echo "   trezo-core: 47qSrNsBPRje72jF1qfeTvTzkpJz5PUuFw9JBDRsCzDn"
echo "   trezo-hook: AkVudTF3DrGYYHeEC3ACL8LRB77GQF7G8N63ZMTX6kYe"