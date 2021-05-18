import { createContext, DependencyList, useContext, useEffect } from "react";
import axios from "axios";

import type KeycloakAdminClient from "keycloak-admin";
import { useErrorHandler } from "react-error-boundary";

export const AdminClient = createContext<KeycloakAdminClient | undefined>(
  undefined
);

export const useAdminClient = () => {
  return useContext(AdminClient)!;
};

/**
 * Util function to only set the state when the component is still mounted.
 *
 * It takes 2 functions one you do your adminClient call in and the other to set your state
 *
 * @example
 * useFetch(
 *  () => adminClient.components.findOne({ id }),
 *  (component) => setupForm(component),
 *  []
 * );
 *
 * @param adminClientCall use this to do your adminClient call
 * @param callback when the data is fetched this is where you set your state
 */
export function useFetch<T>(
  adminClientCall: () => Promise<T>,
  callback: (param: T) => void,
  deps?: DependencyList
) {
  const adminClient = useAdminClient();
  const onError = useErrorHandler();

  const source = axios.CancelToken.source();
  adminClient.setConfig({ requestConfig: { cancelToken: source.token } });

  useEffect(() => {
    adminClientCall()
      .then((result) => {
        callback(result);
      })
      .catch((error) => {
        if (!axios.isCancel(error)) {
          onError(error);
        }
      });

    return () => {
      source.cancel();
    };
  }, deps);
}
