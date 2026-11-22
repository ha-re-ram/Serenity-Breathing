import { useReducer, useEffect, useCallback } from 'react';
import { getRandomQuote } from '../constants/quotes';

export type QuoteStatus = 'loading' | 'ready' | 'refreshing';

export interface QuoteState {
  status: QuoteStatus;
  quote: string;
}

export type QuoteEvent =
  | { type: 'LOAD_QUOTE'; quote: string }
  | { type: 'REFRESH_START' }
  | { type: 'REFRESH_SUCCESS'; quote: string }
  | { type: 'REFRESH_QUOTE' };

export const initialQuoteState: QuoteState = {
  status: 'loading',
  quote: '',
};

export function quoteReducer(state: QuoteState, event: QuoteEvent): QuoteState {
  switch (event.type) {
    case 'LOAD_QUOTE':
      return {
        status: 'ready',
        quote: event.quote,
      };

    case 'REFRESH_START':
      return {
        ...state,
        status: 'refreshing',
      };

    case 'REFRESH_SUCCESS':
      return {
        status: 'ready',
        quote: event.quote,
      };

    case 'REFRESH_QUOTE':
      return {
        status: 'ready',
        quote: getRandomQuote(),
      };

    default:
      return state;
  }
}

export function useQuoteMachine() {
  const [state, dispatch] = useReducer(quoteReducer, initialQuoteState);

  useEffect(() => {
    dispatch({ type: 'LOAD_QUOTE', quote: getRandomQuote() });
  }, []);

  const refreshQuote = useCallback(() => {
    dispatch({ type: 'REFRESH_START' });
    const timer = setTimeout(() => {
      dispatch({ type: 'REFRESH_SUCCESS', quote: getRandomQuote() });
    }, 250);
    return () => clearTimeout(timer);
  }, []);

  return {
    quote: state.quote,
    isLoading: state.status === 'loading',
    isRefreshing: state.status === 'refreshing',
    refreshQuote,
  };
}
