// @vitest-environment jsdom

import '@testing-library/jest-dom/vitest';
import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import { StorefrontSearchResults } from '../components/StorefrontSearchResults';
import type { Product } from '../services/storefrontProducts';

describe('StorefrontSearchResults regression tests (Task: Search click must navigate to product page)', () => {
  const dummyProductWithSlug: Product = {
    id: 'prod-113',
    name: 'كوتشي لمسه',
    description: 'كوتشي مريح عالي الجودة',
    price: 350,
    images: ['/uploads/products/product-b0b1c16e-395a-40d4-8424-c40f871f9baf.jpeg'],
    slug: 'kotchii-lamsa-10',
    sku: 'sw-113',
  };

  const dummyProductWithoutSlug: Product = {
    id: 'prod-999',
    name: 'حذاء بدون slug',
    description: 'حذاء تجريبي',
    price: 400,
    images: [],
    slug: '',
    sku: 'sw-999',
  };

  it('renders search result link pointing to /product/<slug> and NOT to / or /product/', () => {
    const closeSpy = vi.fn();
    render(
      <MemoryRouter initialEntries={['/']}>
        <StorefrontSearchResults
          results={[dummyProductWithSlug]}
          isLoading={false}
          close={closeSpy}
        />
      </MemoryRouter>,
    );

    const link = screen.getByTestId('search-result-prod-113');
    expect(link).toBeInTheDocument();
    // Regression check: href MUST be /product/kotchii-lamsa-10 and never "/" or "/product/"
    expect(link.getAttribute('href')).toBe('/product/kotchii-lamsa-10');
    expect(link.getAttribute('href')).not.toBe('/');
    expect(link.getAttribute('href')).not.toBe('/product/');
  });

  it('falls back to /product/<id> when product slug is missing or empty', () => {
    const closeSpy = vi.fn();
    render(
      <MemoryRouter initialEntries={['/']}>
        <StorefrontSearchResults
          results={[dummyProductWithoutSlug]}
          isLoading={false}
          close={closeSpy}
        />
      </MemoryRouter>,
    );

    const link = screen.getByTestId('search-result-prod-999');
    expect(link).toBeInTheDocument();
    expect(link.getAttribute('href')).toBe('/product/prod-999');
  });

  it('preserves /store base path when storefront is mounted under /store', () => {
    const closeSpy = vi.fn();
    render(
      <MemoryRouter initialEntries={['/store']}>
        <StorefrontSearchResults
          results={[dummyProductWithSlug]}
          isLoading={false}
          close={closeSpy}
        />
      </MemoryRouter>,
    );

    const link = screen.getByTestId('search-result-prod-113');
    expect(link.getAttribute('href')).toBe('/store/product/kotchii-lamsa-10');
  });

  it('preserves preview query parameters during product navigation', () => {
    const closeSpy = vi.fn();
    render(
      <MemoryRouter initialEntries={['/?previewTheme=khemet-luxe-eg&previewSource=settings']}>
        <StorefrontSearchResults
          results={[dummyProductWithSlug]}
          isLoading={false}
          close={closeSpy}
        />
      </MemoryRouter>,
    );

    const link = screen.getByTestId('search-result-prod-113');
    expect(link.getAttribute('href')).toContain('/product/kotchii-lamsa-10');
    expect(link.getAttribute('href')).toContain('previewTheme=khemet-luxe-eg');
  });

  it('displays empty results message when results array is empty', () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <StorefrontSearchResults
          results={[]}
          isLoading={false}
          close={vi.fn()}
        />
      </MemoryRouter>,
    );

    expect(screen.getByText('لا توجد منتجات تطابق بحثك.')).toBeInTheDocument();
  });
});
