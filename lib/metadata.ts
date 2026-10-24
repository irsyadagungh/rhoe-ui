import type { Metadata } from "next";

type PageMetadata = {
  title: string;
  description: string;
  path: `/${string}` | "/";
};

export function createPageMetadata({ title, description, path }: PageMetadata): Metadata {
  const socialTitle = `${title} | Rhoe UI`;

  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: {
      type: "website",
      url: path,
      siteName: "Rhoe UI",
      title: socialTitle,
      description,
      images: [
        {
          url: "/og-image.png",
          width: 1200,
          height: 630,
          alt: socialTitle,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: socialTitle,
      description,
      images: ["/og-image.png"],
    },
  };
}
