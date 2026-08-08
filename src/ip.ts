/**
 * Check if IP address falls within any of the given CIDR ranges
 * @param {string} ip IPV4 to check (192.168.0.12)
 * @param {...string} cidrs IP ranges to check against (example: 192.168.0.0/24)
 * @returns {boolean} Whether IP address is within any range
 */
export function matchesCidr(ip: string, ...cidrs: string[]): boolean {
	if (!ip) return false;
	if (!cidrs.length) return true;
	const ipToInt = (str: string) => str.split('.')
		.reduce((int, octet) => (int << 8) + parseInt(octet), 0) >>> 0;
	return cidrs.some(cidr => {
		if (!cidr) return true;
		if (!cidr.includes('/')) return ip === cidr; // Single IP
		const [range, bits] = cidr.split('/');
		const mask = ~(2 ** (32 - parseInt(bits)) - 1);
		return (ipToInt(ip) & mask) === (ipToInt(range) & mask);
	});
}

/**
 * Convert IPv6 to v4 because who uses that, NAT4Life
 * @param {string} ip IPv6 address, e.g. 2001:0db8:85a3:0000:0000:8a2e:0370:7334
 * @returns {string | null} IPv4 address, e.g. 172.16.58.3
 */
export function ipV6ToV4(ip: string) {
	if(!ip) return null;
	const ipv4 = ip.split(':').splice(-1)[0];
	if(ipv4 == '1') return '127.0.0.1';
	return ipv4;
}

/**
 * @deprecated Use isReserved
 *
 * Check if IP is reserved, e.g. localhost, private IPs, etc.
 * @param {string} ip
 * @returns {boolean}
 */
export function reservedIp(ip: string): boolean {
	if(ip == 'localhost' || ip == '127.0.0.1') return true;
	return /\b(10\.(?:[0-9]{1,3}\.){2}[0-9]{1,3})\b|\b(172\.(?:1[6-9]|2[0-9]|3[0-1])\.(?:[0-9]{1,3}\.)[0-9]{1,3})\b|\b(192\.168\.(?:[0-9]{1,3}\.)[0-9]{1,3})\b/.test(ip);
}

/**
 * Check if IP is within a reserved range
 * @param {string} ip
 * @returns {string | null}
 */
export function isReserved(ip: string) {
	const ipToNumber = (ip: string) => {
		return ip.split('.').reduce((acc: number, octet: string) => (acc << 8) + parseInt(octet, 10), 0) >>> 0;
	};

	const ipNum = ipToNumber(ip);
	if (ipNum === null) return 'invalid';

	const reserved = [
		{ name: "This host", start: ipToNumber("0.0.0.0"), end: ipToNumber("0.255.255.255") },
		{ name: "Loopback", start: ipToNumber("127.0.0.0"), end: ipToNumber("127.255.255.255") },
		{ name: "Private (Class A)", start: ipToNumber("10.0.0.0"), end: ipToNumber("10.255.255.255") },
		{ name: "CGNAT", start: ipToNumber("100.64.0.0"), end: ipToNumber("100.127.255.255") },
		{ name: "Private (Class B)", start: ipToNumber("172.16.0.0"), end: ipToNumber("172.31.255.255") },
		{ name: "Private (Class C)", start: ipToNumber("192.168.0.0"), end: ipToNumber("192.168.255.255") },
		{ name: "Link-Local", start: ipToNumber("169.254.0.0"), end: ipToNumber("169.254.255.255") },
		{ name: "IETF Protocol Assignments", start: ipToNumber("192.0.0.0"), end: ipToNumber("192.0.0.255") },
		{ name: "Documentation (TEST-NET-1)", start: ipToNumber("192.0.2.0"), end: ipToNumber("192.0.2.255") },
		{ name: "Benchmarking", start: ipToNumber("198.18.0.0"), end: ipToNumber("198.19.255.255") },
		{ name: "Documentation (TEST-NET-2)", start: ipToNumber("198.51.100.0"), end: ipToNumber("198.51.100.255") },
		{ name: "Documentation (TEST-NET-3)", start: ipToNumber("203.0.113.0"), end: ipToNumber("203.0.113.255") },
		{ name: "Multicast", start: ipToNumber("224.0.0.0"), end: ipToNumber("239.255.255.255") },
		{ name: "Reserved (Class E)", start: ipToNumber("240.0.0.0"), end: ipToNumber("255.255.255.255") }
	];

	const match = reserved.find(r => ipNum >= r.start && ipNum <= r.end);
	return match ? match.name : null;
}
