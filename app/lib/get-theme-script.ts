export function getThemeScript(): string {
    return `
    (function () {
      try {
        var cookie = document.cookie
          .split(' ')
          .find(c => c.startsWith('theme='))
        var theme = cookie ? cookie.split('=')[1] : 'system'
        var applied =
          theme === 'system'
            ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
            : theme
        document.documentElement.classList.add(applied)
      } catch (_) {}
    })()
  `
}