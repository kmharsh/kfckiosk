import axios from "axios";
import { WEB_API } from "./constants";
const customFetch = axios.create({
      baseURL: WEB_API,
    headers: {
        'Content-type': 'application/json',
    },
    withCredentials: false,
});

export const getFetchData = async (url, headers = {}) => {
    try {
        const response = await customFetch.get(url, { headers });
        return response?.data;
    } catch (error) {
        console.error(`GET Error in ${url}:`, error);
        throw error;
    }
};

export const postFetchData = async (url, data, headers = {}) => {
    
    try {
        const response = await customFetch.post(url, data, { headers });

        return response?.data;
    } catch (error) {
        console.error(`POST Error in ${url}:`, error);
        throw error;
    }
};
