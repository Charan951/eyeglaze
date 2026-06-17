import { useEffect } from 'react';

interface SEOProps {
  title?: string;
  description?: string;
  keywords?: string;
  image?: string;
  url?: string;
  type?: string;
  robots?: string;
  schema?: Record<string, any>;
}

export default function SEO({
  title,
  description,
  keywords,
  image,
  url,
  type = 'website',
  robots = 'index, follow',
  schema,
}: SEOProps) {
  useEffect(() => {
    // 1. Title
    const defaultTitle = 'EyeGlaze | Premium Designer Eyewear & Prescription Lenses';
    document.title = title ? `${title} | EyeGlaze` : defaultTitle;

    // Helper to add/update meta tags
    const updateMetaTag = (name: string, content: string, attr: 'name' | 'property' = 'name') => {
      let el = document.querySelector(`meta[${attr}="${name}"]`);
      if (content) {
        if (!el) {
          el = document.createElement('meta');
          el.setAttribute(attr, name);
          document.head.appendChild(el);
        }
        el.setAttribute('content', content);
      } else if (el) {
        el.remove();
      }
    };

    // Helper to add/update link tags
    const updateLinkTag = (rel: string, href: string) => {
      let el = document.querySelector(`link[rel="${rel}"]`);
      if (href) {
        if (!el) {
          el = document.createElement('link');
          el.setAttribute('rel', rel);
          document.head.appendChild(el);
        }
        el.setAttribute('href', href);
      } else if (el) {
        el.remove();
      }
    };

    // 2. Standard Metas
    const defaultDesc = 'Discover premium luxury frames, designer eyeglasses, and custom prescription lenses online at EyeGlaze.';
    updateMetaTag('description', description || defaultDesc);

    const defaultKeywords = 'eyeglaze, eyeglasses, designer eyewear, prescription lenses, premium frames';
    updateMetaTag('keywords', keywords || defaultKeywords);

    updateMetaTag('robots', robots);

    // 3. Canonical URL
    const currentUrl = url || window.location.href;
    updateLinkTag('canonical', currentUrl);

    // 4. Open Graph Metas
    const pageTitle = title ? `${title} | EyeGlaze` : defaultTitle;
    updateMetaTag('og:title', pageTitle, 'property');
    updateMetaTag('og:description', description || defaultDesc, 'property');
    updateMetaTag('og:type', type, 'property');
    updateMetaTag('og:url', currentUrl, 'property');
    if (image) {
      updateMetaTag('og:image', image, 'property');
    }

    // 5. Twitter Card Metas
    updateMetaTag('twitter:card', 'summary_large_image');
    updateMetaTag('twitter:title', pageTitle);
    updateMetaTag('twitter:description', description || defaultDesc);
    if (image) {
      updateMetaTag('twitter:image', image);
    }

    // 6. JSON-LD Schema
    let schemaScript = document.getElementById('dynamic-jsonld-schema');
    if (schemaScript) {
      schemaScript.remove();
    }
    if (schema) {
      const script = document.createElement('script');
      script.id = 'dynamic-jsonld-schema';
      script.type = 'application/ld+json';
      script.innerHTML = JSON.stringify(schema);
      document.head.appendChild(script);
    }

    // Cleanup on unmount
    return () => {
      const existingScript = document.getElementById('dynamic-jsonld-schema');
      if (existingScript) {
        existingScript.remove();
      }
    };
  }, [title, description, keywords, image, url, type, robots, schema]);

  return null; // SEO component only handles side-effects
}
