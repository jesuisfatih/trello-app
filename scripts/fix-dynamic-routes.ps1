# Fix all dynamic routes for Next.js 16

$files = @(
  "src/app/api/trello/cards/[cardId]/route.ts",
  "src/app/api/trello/cards/[cardId]/comments/route.ts",
  "src/app/api/trello/cards/[cardId]/comments/[commentId]/route.ts"
)

foreach ($file in $files) {
  if (Test-Path $file) {
    $content = Get-Content $file -Raw
    
    # Fix GET
    $content = $content -replace '{ params }: { params: { cardId: string } }', 'context: { params: Promise<{ cardId: string }> }'
    $content = $content -replace '{ params }: { params: { cardId: string; commentId: string } }', 'context: { params: Promise<{ cardId: string; commentId: string }> }'
    
    # Fix PUT
    $content = $content -replace 'export async function PUT\(\s*request: NextRequest,\s*{ params }', 'export async function PUT(request: NextRequest, context'
    
    # Fix DELETE  
    $content = $content -replace 'export async function DELETE\(\s*request: NextRequest,\s*{ params }', 'export async function DELETE(request: NextRequest, context'
    
    # Fix POST
    $content = $content -replace 'export async function POST\(\s*request: NextRequest,\s*{ params }', 'export async function POST(request: NextRequest, context'
    
    # Add await params after try {
    if ($content -notmatch 'const params = await context.params') {
      $content = $content -replace '(\) \{\s*try \{)', "`$1`n  const params = await context.params;"
    }
    
    Set-Content $file $content
    Write-Host "✅ Fixed: $file"
  }
}

Write-Host "`n✅ All dynamic routes fixed!"

