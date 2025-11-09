import { useEffect } from "react";

interface SEOOptions {
  title: string;
  description?: string;
  canonicalPath?: string;
}

export function usePageSEO({ title, description, canonicalPath }: SEOOptions) {
  useEffect(() => {
    if (title) {
      document.title = title;
    }

    if (description) {
      let meta = document.querySelector('meta[name="description"]') as HTMLMetaElement | null;
      if (!meta) {
        meta = document.createElement('meta');
        meta.name = 'description';
        document.head.appendChild(meta);
      }
      meta.content = description;
    }

    if (canonicalPath) {
      let link = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
      if (!link) {
        link = document.createElement('link');
        link.rel = 'canonical';
        document.head.appendChild(link);
      }
      try {
        const url = new URL(canonicalPath, window.location.origin);
        link.href = url.toString();
      } catch {
        link.href = `${window.location.origin}${canonicalPath}`;
      }
    }
  }, [title, description, canonicalPath]);
}
