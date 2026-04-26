export const dynamic = "force-static";

export function GET() {
  const html = [
    "<!DOCTYPE html>",
    "<html>",
    "<head>",
    '<meta name="bmstable" content="header.json" />',
    "</head>",
    "<body></body>",
    "</html>",
  ].join("\n");

  return new Response(html, {
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}
