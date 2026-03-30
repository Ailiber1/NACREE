// Middleware is not supported in static export (output: 'export')
// Authentication checks have been moved to client-side:
// - Admin layout: src/app/admin/layout.tsx (useEffect auth check)
// - Mypage: src/app/mypage/page.tsx (useEffect auth check)
export {};
