// import {createClient, RedisClientType} from 'redis';
// import {environment} from '../environments/environment';
//
// export type RedisKey = string | string[];
//
// export let Redis!: RedisClientType & {
// 	// get/set shimmed for JSON
// 	jGet: (redisKey: string) => Promise<any>,
// 	jSet: (redisKey: string, obj: any, opts?: any) => Promise<void>,
// 	// hGet/hSet shimmed for objects
// 	oGet: (redisKey: string) => Promise<any>;
// 	oSet: (redisKey: string, obj: any) => Promise<void>,
// 	// Helpers
// 	findKeys: (filter: RedisKey) => Promise<string[]>,
// 	forEach: (filter: RedisKey, cb: (key: string) => any) => Promise<void>,
// };
//
// export async function connectRedis(retry = 3) {
// 	Redis = <any>createClient({
// 		url: `redis://host:port`
// 	});
// 	if(!Redis && retry > 0) {
// 		await connectRedis(retry - 1);
// 	} else if(!!Redis) {
// 		Redis.jGet = async (redisKey: string) => {
// 			const val = await Redis.get(redisKey);
// 			return val ? JSON.parse(val) || val : null;
// 		};
// 		Redis.jSet = (redisKey: string, obj: any, opts?: any) => {
// 			return Redis.set(redisKey, JSON.stringify(obj), opts).then(() => {});
// 		};
// 		Redis.oGet = async (redisKey: string) => {
// 			if(!(await Redis.hLen(redisKey))) return null;
// 			const val = await Redis.hGetAll(redisKey);
// 			Object.entries(val).forEach(([key, v]) => val[key] = JSON.parse(v));
// 			return val;
// 		};
// 		Redis.oSet = (redisKey: string, obj: any) => {
// 			const r = Redis.multi();
// 			Object.entries(obj).forEach(([key, val]) => {
// 				r.hSet(redisKey, key, JSON.stringify(val));
// 			});
// 			return r.exec().then(() => {});
// 		};
// 		Redis.findKeys = async (filter: RedisKey): Promise<string[]> => {
// 			const found: string[] = [];
// 			await Redis.forEach(filter, (key: string) => found.push(key));
// 			return found;
// 		}
// 		Redis.forEach = async (filter: RedisKey, cb: (key: string) => any): Promise<void> => {
// 			for await (const k of Redis.scanIterator({MATCH: createKey(filter)})) {
// 				const rtn = cb(k);
// 				if(rtn instanceof Promise) await rtn;
// 			}
// 		}
// 		await Redis.connect();
// 	}
// }
//
// export function createKey(...keys: (string | string[])[]) {
// 	return keys.flat().map(k => k == null ? '*' : k).join(':');
// }
//
// export function namespacedKey(namespace: string, key: RedisKey): string {
// 	return createKey(namespace, ...(Array.isArray(key) ? key : [key]));
// }
//
// export function nameSpacer(namespace: string) {
// 	return (key: RedisKey) => {
// 		return namespacedKey(namespace, key);
// 	};
// }
