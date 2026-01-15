import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useReadRecipes, useSearchRecipes } from '@/api/recipes/recipes';

export function useHomeRecipes() {
  const [searchParams, setSearchParams] = useSearchParams();
  
  const queryFromUrl = searchParams.get('q') || '';

  const [searchTerm, setSearchTerm] = useState(queryFromUrl);

  useEffect(() => {
    setSearchTerm(queryFromUrl);
  }, [queryFromUrl]);

  const isSearching = queryFromUrl.length > 0;

  // API
  const { 
    data: allRecipes, 
    isLoading: isLoadingAll,
    isError: isErrorAll
  } = useReadRecipes(
    { limit: 100, skip: 0 },
    { query: { enabled: !isSearching } }
  );

  const { 
    data: searchResults, 
    isLoading: isLoadingSearch,
    isError: isErrorSearch
  } = useSearchRecipes(
    { q: queryFromUrl },
    { query: { enabled: isSearching } }
  );

  // ACTIONS
  const handleSearch = () => {
    if (!searchTerm.trim()) {
      handleClear();
      return;
    }
    setSearchParams({ q: searchTerm });
  };

  const handleClear = () => {
    setSearchTerm('');
    setSearchParams({});
  };
  
  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  // VIEW MODEL
  const recipes = isSearching ? searchResults : allRecipes;
  const isLoading = isSearching ? isLoadingSearch : isLoadingAll;
  const isError = isSearching ? isErrorSearch : isErrorAll;

  const getHeading = () => {
    if (isSearching) {
      if (isLoading) {
        return `Searching for "${queryFromUrl}"...`;
      }
      return `Results for "${queryFromUrl}"`;
    }
    return 'Find your dream meal';
  };

  return {
    searchTerm,
    setSearchTerm,
    handleSearch,
    handleClear,
    onKeyDown,
    
    recipes,
    isLoading,
    isError,
    isEmpty: !isLoading && !isError && recipes?.length === 0,
    isSearchView: isSearching,
    submittedSearch: queryFromUrl,
    isSearching,
    heading: getHeading(),
  };
}