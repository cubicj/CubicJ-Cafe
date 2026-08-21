export default function Footer() {
  return (
    <footer className="border-t bg-foreground py-6 text-background/80">
      <div className="container mx-auto flex flex-wrap items-center justify-center gap-x-2 gap-y-1 px-4 font-mono text-xs">
        <span>© 2026 CubicJ Cafe</span>
        <span className="flex items-center gap-x-2 whitespace-nowrap">
          <span aria-hidden="true">·</span>
          <span>Self-hosted on Mini PC</span>
        </span>
        <span className="flex items-center gap-x-2 whitespace-nowrap">
          <span aria-hidden="true">·</span>
          <a
            href="https://github.com/cubicj"
            target="_blank"
            rel="noopener noreferrer"
            className="underline-offset-4 transition-colors hover:text-background hover:underline"
          >
            github.com/cubicj
          </a>
        </span>
      </div>
    </footer>
  );
}
