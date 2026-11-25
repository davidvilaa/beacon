import { isExcludedTmdbMedia } from "@/lib/providers/tmdb/filters";
import { fetchFromTmdb } from "@/lib/providers/tmdb/client";
import type { Movie, MultiSearchItem, TmdbPaginatedResponse, TvShow } from "@/lib/providers/tmdb/types";

export async function searchMovies(
  query: string,
  page: number = 1
): Promise<TmdbPaginatedResponse<Movie>> {
  if (!query.trim()) {
    return {
      page: 1,
      results: [],
      total_pages: 0,
      total_results: 0,
    };
  }

  const data = await fetchFromTmdb<TmdbPaginatedResponse<Movie>>("/search/movie", {
    query: query.trim(),
    page,
    include_adult: "false",
  });

  const filtered = (data.results || []).filter(
    (movie) => !isExcludedTmdbMedia(movie)
  );

  return {
    ...data,
    results: filtered,
  };
}

export async function searchTv(
  query: string,
  page: number = 1
): Promise<TmdbPaginatedResponse<TvShow>> {
  if (!query.trim()) {
    return {
      page: 1,
      results: [],
      total_pages: 0,
      total_results: 0,
    };
  }

  const data = await fetchFromTmdb<TmdbPaginatedResponse<TvShow>>("/search/tv", {
    query: query.trim(),
    page,
    include_adult: "false",
  });

  const filtered = (data.results || []).filter(
    (tv) => !isExcludedTmdbMedia(tv)
  );

  return {
    ...data,
    results: filtered,
  };
}

export async function searchMulti(
  query: string,
  page: number = 1
): Promise<TmdbPaginatedResponse<MultiSearchItem>> {
  if (!query.trim()) {
    return {
      page: 1,
      results: [],
      total_pages: 0,
      total_results: 0,
    };
  }

  const data = await fetchFromTmdb<TmdbPaginatedResponse<MultiSearchItem>>("/search/multi", {
    query: query.trim(),
    page,
    include_adult: "false",
  });

  const filtered = (data.results || []).filter(
    (item) => !isExcludedTmdbMedia(item)
  );

  return {
    ...data,
    results: filtered,
  };
}

export async function searchPerson(
  query: string,
  page: number = 1
): Promise<TmdbPaginatedResponse<any>> {
  if (!query.trim()) {
    return {
      page: 1,
      results: [],
      total_pages: 0,
      total_results: 0,
    };
  }

  return fetchFromTmdb<TmdbPaginatedResponse<any>>("/search/person", {
    query: query.trim(),
    page,
    include_adult: "false",
  });
}

export async function searchCompany(
  query: string,
  page: number = 1
): Promise<TmdbPaginatedResponse<any>> {
  if (!query.trim()) {
    return {
      page: 1,
      results: [],
      total_pages: 0,
      total_results: 0,
    };
  }

  return fetchFromTmdb<TmdbPaginatedResponse<any>>("/search/company", {
    query: query.trim(),
    page,
  });
}
