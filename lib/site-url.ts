const fallbackSiteUrl = "http://localhost:3000";

export const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL ?? fallbackSiteUrl).replace(/\/+$/, "");
export const githubUrl = (process.env.NEXT_PUBLIC_GITHUB_URL ?? "https://github.com/irsyadagungh/rhoe-ui").replace(/\/+$/, "");
export const threadsUrl = (process.env.NEXT_PUBLIC_THREADS_URL ?? "https://www.threads.net/@sadd.8_").replace(/\/+$/, "");

export function registryUrl(name: string) {
  return `${siteUrl}/r/${name}.json`;
}
