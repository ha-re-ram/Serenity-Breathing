import { useReducer, useCallback } from 'react';

export type AuthMode = 'signIn' | 'signUp' | 'forgotPassword';
export type AuthStatus = 'idle' | 'submitting' | 'success' | 'error';

export interface AuthFormState {
  mode: AuthMode;
  status: AuthStatus;
  email: string;
  password: string;
  name: string;
  errorMessage: string | null;
}

export type AuthFormEvent =
  | { type: 'SWITCH_MODE'; mode: AuthMode }
  | { type: 'SET_FIELD'; field: 'email' | 'password' | 'name'; value: string }
  | { type: 'SUBMIT_START' }
  | { type: 'SUBMIT_SUCCESS' }
  | { type: 'SUBMIT_ERROR'; error: string }
  | { type: 'RESET_FORM' };

export const initialAuthFormState: AuthFormState = {
  mode: 'signIn',
  status: 'idle',
  email: '',
  password: '',
  name: '',
  errorMessage: null,
};

export function authFormReducer(state: AuthFormState, event: AuthFormEvent): AuthFormState {
  switch (event.type) {
    case 'SWITCH_MODE':
      return {
        ...state,
        mode: event.mode,
        status: 'idle',
        errorMessage: null,
      };

    case 'SET_FIELD':
      return {
        ...state,
        [event.field]: event.value,
        errorMessage: null,
      };

    case 'SUBMIT_START':
      return {
        ...state,
        status: 'submitting',
        errorMessage: null,
      };

    case 'SUBMIT_SUCCESS':
      return {
        ...state,
        status: 'success',
        errorMessage: null,
      };

    case 'SUBMIT_ERROR':
      return {
        ...state,
        status: 'error',
        errorMessage: event.error,
      };

    case 'RESET_FORM':
      return initialAuthFormState;

    default:
      return state;
  }
}

export function useAuthFormMachine() {
  const [state, dispatch] = useReducer(authFormReducer, initialAuthFormState);

  const switchMode = useCallback((mode: AuthMode) => {
    dispatch({ type: 'SWITCH_MODE', mode });
  }, []);

  const setField = useCallback((field: 'email' | 'password' | 'name', value: string) => {
    dispatch({ type: 'SET_FIELD', field, value });
  }, []);

  const startSubmit = useCallback(() => {
    dispatch({ type: 'SUBMIT_START' });
  }, []);

  const succeedSubmit = useCallback(() => {
    dispatch({ type: 'SUBMIT_SUCCESS' });
  }, []);

  const failSubmit = useCallback((error: string) => {
    dispatch({ type: 'SUBMIT_ERROR', error });
  }, []);

  const reset = useCallback(() => {
    dispatch({ type: 'RESET_FORM' });
  }, []);

  return {
    state,
    switchMode,
    setField,
    startSubmit,
    succeedSubmit,
    failSubmit,
    reset,
  };
}

