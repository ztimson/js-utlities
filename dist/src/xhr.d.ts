export type FetchInterceptor = (resp: Response, next: () => any) => any;
export declare class XHR<T> {
    readonly baseUrl: string;
    readonly headers: Record<string, string | null>;
    private static interceptors;
    static headers: Record<string, string | null>;
    private interceptors;
    constructor(baseUrl: string, headers?: Record<string, string | null>);
    static addInterceptor(fn: FetchInterceptor): () => {};
    static addInterceptor(key: string, fn: FetchInterceptor): () => {};
    addInterceptor(fn: FetchInterceptor): () => {};
    addInterceptor(key: string, fn: FetchInterceptor): () => {};
    getInterceptors(): FetchInterceptor[];
    fetch<T2 = T>(href?: string, body?: any, opts?: any): Promise<T2>;
    delete<T2 = void>(url?: string, opts?: any): Promise<T2>;
    get<T2 = T>(url?: string, opts?: any): Promise<T2>;
    patch<T2 = T>(data: T2, url?: string, opts?: any): Promise<T2>;
    post<T2 = T>(data: T2, url?: string, opts?: any): Promise<T2>;
    put<T2 = T>(data: Partial<T2>, url?: string, opts?: any): Promise<T2>;
    new<T2 = T>(href: string, headers: Record<string, string | null>): XHR<T2>;
}
//# sourceMappingURL=xhr.d.ts.map