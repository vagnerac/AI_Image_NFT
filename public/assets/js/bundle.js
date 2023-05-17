/******/ (() => { // webpackBootstrap
/******/ 	var __webpack_modules__ = ({

/***/ "?ce41":
/*!************************!*\
  !*** crypto (ignored) ***!
  \************************/
/***/ (() => {

/* (ignored) */

/***/ }),

/***/ "./node_modules/@adraffy/ens-normalize/dist/index-xnf.js":
/*!***************************************************************!*\
  !*** ./node_modules/@adraffy/ens-normalize/dist/index-xnf.js ***!
  \***************************************************************/
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "ens_beautify": () => (/* binding */ ens_beautify),
/* harmony export */   "ens_emoji": () => (/* binding */ ens_emoji),
/* harmony export */   "ens_normalize": () => (/* binding */ ens_normalize),
/* harmony export */   "ens_normalize_fragment": () => (/* binding */ ens_normalize_fragment),
/* harmony export */   "ens_split": () => (/* binding */ ens_split),
/* harmony export */   "ens_tokenize": () => (/* binding */ ens_tokenize),
/* harmony export */   "is_combining_mark": () => (/* binding */ is_combining_mark),
/* harmony export */   "nfc": () => (/* binding */ nfc),
/* harmony export */   "nfd": () => (/* binding */ nfd),
/* harmony export */   "safe_str_from_cps": () => (/* binding */ safe_str_from_cps),
/* harmony export */   "should_escape": () => (/* binding */ should_escape)
/* harmony export */ });
function decode_arithmetic(bytes) {
	let pos = 0;
	function u16() { return (bytes[pos++] << 8) | bytes[pos++]; }
	
	// decode the frequency table
	let symbol_count = u16();
	let total = 1;
	let acc = [0, 1]; // first symbol has frequency 1
	for (let i = 1; i < symbol_count; i++) {
		acc.push(total += u16());
	}

	// skip the sized-payload that the last 3 symbols index into
	let skip = u16();
	let pos_payload = pos;
	pos += skip;

	let read_width = 0;
	let read_buffer = 0; 
	function read_bit() {
		if (read_width == 0) {
			// this will read beyond end of buffer
			// but (undefined|0) => zero pad
			read_buffer = (read_buffer << 8) | bytes[pos++];
			read_width = 8;
		}
		return (read_buffer >> --read_width) & 1;
	}

	const N = 31;
	const FULL = 2**N;
	const HALF = FULL >>> 1;
	const QRTR = HALF >> 1;
	const MASK = FULL - 1;

	// fill register
	let register = 0;
	for (let i = 0; i < N; i++) register = (register << 1) | read_bit();

	let symbols = [];
	let low = 0;
	let range = FULL; // treat like a float
	while (true) {
		let value = Math.floor((((register - low + 1) * total) - 1) / range);
		let start = 0;
		let end = symbol_count;
		while (end - start > 1) { // binary search
			let mid = (start + end) >>> 1;
			if (value < acc[mid]) {
				end = mid;
			} else {
				start = mid;
			}
		}
		if (start == 0) break; // first symbol is end mark
		symbols.push(start);
		let a = low + Math.floor(range * acc[start]   / total);
		let b = low + Math.floor(range * acc[start+1] / total) - 1;
		while (((a ^ b) & HALF) == 0) {
			register = (register << 1) & MASK | read_bit();
			a = (a << 1) & MASK;
			b = (b << 1) & MASK | 1;
		}
		while (a & ~b & QRTR) {
			register = (register & HALF) | ((register << 1) & (MASK >>> 1)) | read_bit();
			a = (a << 1) ^ HALF;
			b = ((b ^ HALF) << 1) | HALF | 1;
		}
		low = a;
		range = 1 + b - a;
	}
	let offset = symbol_count - 4;
	return symbols.map(x => { // index into payload
		switch (x - offset) {
			case 3: return offset + 0x10100 + ((bytes[pos_payload++] << 16) | (bytes[pos_payload++] << 8) | bytes[pos_payload++]);
			case 2: return offset + 0x100 + ((bytes[pos_payload++] << 8) | bytes[pos_payload++]);
			case 1: return offset + bytes[pos_payload++];
			default: return x - 1;
		}
	});
}	

// returns an iterator which returns the next symbol
function read_payload(v) {
	let pos = 0;
	return () => v[pos++];
}
function read_compressed_payload(s) {
	return read_payload(decode_arithmetic(unsafe_atob(s)));
}

// unsafe in the sense:
// expected well-formed Base64 w/o padding 
function unsafe_atob(s) {
	let lookup = [];
	[...'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'].forEach((c, i) => lookup[c.charCodeAt(0)] = i);
	let n = s.length;
	let ret = new Uint8Array((6 * n) >> 3);
	for (let i = 0, pos = 0, width = 0, carry = 0; i < n; i++) {
		carry = (carry << 6) | lookup[s.charCodeAt(i)];
		width += 6;
		if (width >= 8) {
			ret[pos++] = (carry >> (width -= 8));
		}
	}
	return ret;
}

// eg. [0,1,2,3...] => [0,-1,1,-2,...]
function signed(i) { 
	return (i & 1) ? (~i >> 1) : (i >> 1);
}

function read_deltas(n, next) {
	let v = Array(n);
	for (let i = 0, x = 0; i < n; i++) v[i] = x += signed(next());
	return v;
}

// [123][5] => [0 3] [1 1] [0 0]
function read_sorted(next, prev = 0) {
	let ret = [];
	while (true) {
		let x = next();
		let n = next();
		if (!n) break;
		prev += x;
		for (let i = 0; i < n; i++) {
			ret.push(prev + i);
		}
		prev += n + 1;
	}
	return ret;
}

function read_sorted_arrays(next) {
	return read_array_while(() => { 
		let v = read_sorted(next);
		if (v.length) return v;
	});
}

// returns map of x => ys
function read_mapped(next) {
	let ret = [];
	while (true) {
		let w = next();
		if (w == 0) break;
		ret.push(read_linear_table(w, next));
	}
	while (true) {
		let w = next() - 1;
		if (w < 0) break;
		ret.push(read_replacement_table(w, next));
	}
	return ret.flat();
}

// read until next is falsy
// return array of read values
function read_array_while(next) {
	let v = [];
	while (true) {
		let x = next(v.length);
		if (!x) break;
		v.push(x);
	}
	return v;
}

// read w columns of length n
// return as n rows of length w
function read_transposed(n, w, next) {
	let m = Array(n).fill().map(() => []);
	for (let i = 0; i < w; i++) {
		read_deltas(n, next).forEach((x, j) => m[j].push(x));
	}
	return m;
}
 
// returns [[x, ys], [x+dx, ys+dy], [x+2*dx, ys+2*dy], ...]
// where dx/dy = steps, n = run size, w = length of y
function read_linear_table(w, next) {
	let dx = 1 + next();
	let dy = next();
	let vN = read_array_while(next);
	let m = read_transposed(vN.length, 1+w, next);
	return m.flatMap((v, i) => {
		let [x, ...ys] = v;
		return Array(vN[i]).fill().map((_, j) => {
			let j_dy = j * dy;
			return [x + j * dx, ys.map(y => y + j_dy)];
		});
	});
}

// return [[x, ys...], ...]
// where w = length of y
function read_replacement_table(w, next) { 
	let n = 1 + next();
	let m = read_transposed(n, 1+w, next);
	return m.map(v => [v[0], v.slice(1)]);
}

// created 2023-01-26T08:54:35.886Z
var r = read_compressed_payload('AEIRrQh1DccBuQJ+APkBMQDiASoAnADQAHQAngBmANQAaACKAEQAgwBJAHcAOQA9ACoANQAmAGMAHgAvACgAJQAWACwAGQAjAB8ALwAVACgAEQAdAAkAHAARABgAFwA7ACcALAAtADcAEwApABAAHQAfABAAGAAeABsAFwAUBLoF3QEXE7k3ygXaALgArkYBbgCsCAPMAK6GNjY2NjFiAQ0ODBDyAAQHRgbrOAVeBV8APTI5B/a9GAUNz8gAFQPPBeelYALMCjYCjqgCht8/lW+QAsXSAoP5ASbmEADytAFIAjSUCkaWAOoA6QocAB7bwM8TEkSkBCJ+AQQCQBjED/IQBjDwDASIbgwDxAeuBzQAsgBwmO+snIYAYgaaAioG8AAiAEIMmhcCqgLKQiDWCMIwA7gCFAIA9zRyqgCohB8AHgQsAt4dASQAwBnUBQEQIFM+CZ4JjyUiIVbATOqDSQAaABMAHAAVclsAKAAVAE71HN89+gI5X8qc5jUKFyRfVAJfPfMAGgATABwAFXIgY0CeAMPyACIAQAzMFsKqAgHavwViBekC0KYCxLcCClMjpGwUehp0TPwAwhRuAugAEjQ0kBfQmAKBggETIgDEFG4C6AASNAFPUCyYTBEDLgIFMBDecB60Ad5KAHgyEn4COBYoAy4uwD5yAEDoAfwsAM4OqLwBImqIALgMAAwCAIraUAUi3HIeAKgu2AGoBgYGBgYrNAOiAG4BCiA+9Dd7BB8eALEBzgIoAgDmMhJ6OvpQtzOoLjVPBQAGAS4FYAVftr8FcDtkQhlBWEiee5pmZqH/EhoDzA4s+H4qBKpSAlpaAnwisi4BlqqsPGIDTB4EimgQANgCBrJGNioCBzACQGQAcgFoJngAiiQgAJwBUL4ALnAeAbbMAz40KEoEWgF2YAZsAmwA+FAeAzAIDABQSACyAABkAHoAMrwGDvr2IJSGBgAQKAAwALoiTgHYAeIOEjiXf4HvABEAGAA7AEQAPzp3gNrHEGYQYwgFTRBMc0EVEgKzD60L7BEcDNgq0tPfADSwB/IDWgfyA1oDWgfyB/IDWgfyA1oDWgNaA1ocEfAh2scQZg9PBHQFlQWSBN0IiiZQEYgHLwjZVBR0JRxOA0wBAyMsSSM7mjMSJUlME00KCAM2SWyufT8DTjGyVPyQqQPSMlY5cwgFHngSpwAxD3ojNbxOhXpOcacKUk+1tYZJaU5uAsU6rz//CigJmm/Cd1UGRBAeJ6gQ+gw2AbgBPg3wS9sE9AY+BMwfgBkcD9CVnwioLeAM8CbmLqSAXSP4KoYF8Ev3POALUFFrD1wLaAnmOmaBUQMkARAijgrgDTwIcBD2CsxuDegRSAc8A9hJnQCoBwQLFB04FbgmE2KvCww5egb+GvkLkiayEyx6/wXWGiQGUAEsGwIA0i7qhbNaNFwfT2IGBgsoI8oUq1AjDShAunhLGh4HGCWsApRDc0qKUTkeliH5PEANaS4WUX8H+DwIGVILhDyhRq5FERHVPpA9SyJMTC8EOIIsMieOCdIPiAy8fHUBXAkkCbQMdBM0ERo3yAg8BxwwlycnGAgkRphgnQT6ogP2E9QDDgVCCUQHFgO4HDATMRUsBRCBJ9oC9jbYLrYCklaDARoFzg8oH+IQU0fjDuwIngJoA4Yl7gAwFSQAGiKeCEZmAGKP21MILs4IympvI3cDahTqZBF2B5QOWgeqHDYVwhzkcMteDoYLKKayCV4BeAmcAWIE5ggMNV6MoyBEZ1aLWxieIGRBQl3/AjQMaBWiRMCHewKOD24SHgE4AXYHPA0EAnoR8BFuEJgI7oYHNbgz+zooBFIhhiAUCioDUmzRCyom/Az7bAGmEmUDDzRAd/FnrmC5JxgABxwyyEFjIfQLlU/QDJ8axBhFVDEZ5wfCA/Ya9iftQVoGAgOmBhY6UDPxBMALbAiOCUIATA6mGgfaGG0KdIzTATSOAbqcA1qUhgJykgY6Bw4Aag6KBXzoACACqgimAAgA0gNaADwCsAegABwAiEQBQAMqMgEk6AKSA5YINM4BmDIB9iwEHsYMGAD6Om5NAsO0AoBtZqUF4FsCkQJMOAFQKAQIUUpUA7J05ADeAE4GFuJKARiuTc4d5kYB4nIuAMoA/gAIOAcIRAHQAfZwALoBYgs0CaW2uAFQ7CwAhgAYbgHaAowA4AA4AIL0AVYAUAVc/AXWAlJMARQ0Gy5aZAG+AyIBNgEQAHwGzpCozAoiBHAH1gIQHhXkAu8xB7gEAyLiE9BCyAK94VgAMhkKOwqqCqlgXmM2CTR1PVMAER+rPso/UQVUO1Y7WztWO1s7VjtbO1Y7WztWO1sDmsLlwuUKb19IYe4MqQ3XRMs6TBPeYFRgNRPLLboUxBXRJVkZQBq/Jwgl51UMDwct1mYzCC80eBe/AEIpa4NEY4keMwpOHOpTlFT7LR4AtEulM7INrxsYREMFSnXwYi0WEQolAmSEAmJFXlCyAF43IwKh+gJomwJmDAKfhzgeDgJmPgJmKQRxBIIDfxYDfpU5CTl6GjmFOiYmAmwgAjI5OA0CbcoCbbHyjQI2akguAWoA4QDkAE0IB5sMkAEBDsUAELgCdzICdqVCAnlORgJ4vSBf3kWxRvYCfEICessCfQwCfPNIA0iAZicALhhJW0peGBpKzwLRBALQz0sqA4hSA4fpRMiRNQLypF0GAwOxS9FMMCgG0k1PTbICi0ICitvEHgogRmoIugKOOgKOX0OahAKO3AKOX3tRt1M4AA1S11SIApP+ApMPAOwAH1UhVbJV0wksHimYiTLkeGlFPjwCl6IC77VYJKsAXCgClpICln+fAKxZr1oMhFAAPgKWuAKWUVxHXNQCmc4CmWdczV0KHAKcnjnFOqACnBkCn54CnruNACASNC0SAp30Ap6VALhAYTdh8gKe1gKgcQGsAp6iIgKeUahjy2QqKC4CJ7ICJoECoP4CoE/aAqYyAqXRAqgCAIACp/Vof2i0AAZMah9q1AKs5gKssQKtagKtBQJXIAJV3wKx5NoDH1FsmgKywBACsusabONtZm1LYgMl0AK2Xz5CbpMDKUgCuGECuUoYArktenA5cOQCvRwDLbUDMhQCvotyBQMzdAK+HXMlc1ICw84CwwdzhXROOEh04wM8qgADPJ0DPcICxX8CxkoCxhOMAshsVALIRwLJUgLJMQJkoALd1Xh8ZHixeShL0wMYpmcFAmH3GfaVJ3sOXpVevhQCz24Cz28yTlbV9haiAMmwAs92ASztA04Vfk4IAtwqAtuNAtJSA1JfA1NiAQQDVY+AjEIDzhnwY0h4AoLRg5AC2soC2eGEE4RMpz8DhqgAMgNkEYZ0XPwAWALfaALeu3Z6AuIy7RcB8zMqAfSeAfLVigLr9gLpc3wCAur8AurnAPxKAbwC7owC65+WrZcGAu5CA4XjmHxw43GkAvMGAGwDjhmZlgL3FgORcQOSigL3mwL53AL4aZofmq6+OpshA52GAv79AR4APJ8fAJ+2AwWQA6ZtA6bcANTIAwZtoYuiCAwDDEwBIAEiB3AGZLxqCAC+BG7CFI4ethAAGng8ACYDNrIDxAwQA4yCAWYqJACM8gAkAOamCqKUCLoGIqbIBQCuBRjCBfAkREUEFn8Fbz5FRzJCKEK7X3gYX8MAlswFOQCQUyCbwDstYDkYutYONhjNGJDJ/QVeBV8FXgVfBWoFXwVeBV8FXgVfBV4FXwVeBV9NHAjejG4JCQkKa17wMgTQA7gGNsLCAMIErsIA7kcwFrkFTT5wPndCRkK9X3w+X+8AWBgzsgCNBcxyzAOm7kaBRC0qCzIdLj08fnTfccH4GckscAFy13U3HgVmBXHJyMm/CNZQYgcHBwqDXoSSxQA6P4gAChbYBuy0KgwAjMoSAwgUAOVsJEQrJlFCuELDSD8qXy5gPS4/KgnIRAUKSz9KPn8+iD53PngCkELDUElCX9JVVnFUETNyWzYCcQASdSZf5zpBIgluogppKjJDJC1CskLDMswIzANf0BUmNRAPEAMGAQYpfqTfcUE0UR7JssmzCWzI0tMKZ0FmD+wQqhgAk5QkTEIsG7BtQM4/Cjo/Sj53QkYcDhEkU05zYjM0Wui8GQqE9CQyQkYcZA9REBU6W0pJPgs7SpwzCogiNEJGG/wPWikqHzc4BwyPaPBlCnhk0GASYDQqdQZKYCBACSIlYLoNCXIXbFVgVBgIBQZk7mAcYJxghGC6YFJgmG8WHga8FdxcsLxhC0MdsgHCMtTICSYcByMKJQGAAnMBNjecWYcCAZEKv04hAOsqdJUR0RQErU3xAaICjqNWBUdmAP4ARBEHOx1egRKsEysmwbZOAFYTOwMAHBO+NVsC2RJLbBEiAN9VBnwEESVhADgAvQKhLgsWdrIgAWIBjQoDA+D0FgaxBlEGwAAky1ywYRC7aBOQCy1GDsIBwgEpCU4DYQUvLy8nJSYoMxktDSgTlABbAnVel1CcCHUmBA94TgHadRbVWCcgsLdN8QcYBVNmAP4ARBEHgQYNK3MRjhKsPzc0zrZdFBIAZsMSAGpKblAoIiLGADgAvQKhLi1CFdUClxiCAVDCWM90eY7epaIO/KAVRBvzEuASDQ8iAwHOCUEQmgwXMhM9EgBCALrVAQkAqwDoAJuRNgAbAGIbzTVzfTEUyAIXCUIrStroIyUSG4QCggTIEbHxcwA+QDQOrT8u1agjB8IQABBBLtUYIAB9suEjD8IhThzUqHclAUQqZiMC8qAPBFPz6x9sDMMNAQhDCkUABccLRAJSDcIIww1DLtWoMQrDCUMPkhroBCIOwgyYCCILwhZCAKcQwgsFGKd74wA7cgtCDEMAAq0JwwUi1/UMBQ110QaCAAfCEmIYEsMBCADxCAAAexViDRbSG/x2F8IYQgAuwgLyqMIAHsICXCcxhgABwgAC6hVDFcIr8qPCz6hCCgKlJ1IAAmIA5+QZwqViFb/LAPsaggioBRH/dwDfwqfCGOIBGsKjknl5BwKpoooAEsINGxIAA5oAbcINAAvCp0IIGkICwQionNEPAgfHqUIFAOGCL71txQNPAAPyABXCAAcCAAnCAGmSABrCAA7CCRjCjnAWAgABYgAOcgAuUiUABsIAF8IIKAANUQC6wi0AA8IADqIq8gCyYQAcIgAbwgAB8gqoAAXNCxwV4gAHogBCwgEJAGnCAAuCAB3CAAjCCagABdEAbqYZ3ACYCCgABdEAAUIAB+IAHaIIKAAGoQAJggAbMgBtIgDmwocACGIACEIAFMIDAGkCCSgABtEA45IACUILqA7L+2YAB0IAbqNATwBOAArCCwADQgAJtAM+AAciABmCAAISpwIACiIACkIACgKn8gbCAAkiAAMSABBCBwAUQgARcgAPkgAN8gANwgAZEg0WIgAVQgBuoha6AcIAwQATQgBpMhEA4VIAAkIABFkAF4IFIgAG1wAYwgQlAYIvWQBATAC2DwcUDHkALzF3AasMCGUCcyoTBgQQDnZSc2YxkCYFhxsFaTQ9A6gKuwYI3wAdAwIKdQF9eU5ZGygDVgIcRQEzBgp6TcSCWYFHADAAOAgAAgAAAFoR4gCClzMBMgB97BQYOU0IUQBeDAAIVwEOkdMAf0IEJ6wAYQDdHACcbz4mkgDUcrgA1tsBHQ/JfHoiH10kENgBj5eyKVpaVE8ZQ8mQAAAAhiM+RzAy5xieVgB5ATAsNylJIBYDN1wE/sz1AFJs4wBxAngCRhGBOs54NTXcAgEMFxkmCxsOsrMAAAMCBAICABnRAgAqAQAFBQUFBQUEBAQEBAQDBAUGBwgDBAQEBAMBASEAigCNAJI8AOcAuADZAKFDAL8ArwCqAKUA6wCjANcAoADkAQUBAADEAH4AXwDPANEBAADbAO8AjQCmAS4A5wDcANkKAAgOMTrZ2dnZu8Xh0tXTSDccAU8BWTRMAVcBZgFlAVgBSVBISm0SAVAaDA8KOT0SDQAmEyosLjE9Pz9CQkJDRBNFBSNWVlZWWFhXWC5ZWlxbWyJiZmZlZ2Ypa211dHd3d3d3d3l5eXl5eXl5eXl5e3t8e3phAEPxAEgAmQB3ADEAZfcAjQBWAFYANgJz7gCKAAT39wBjAJLxAJ4ATgBhAGP+/q8AhACEAGgAVQCwACMAtQCCAj0CQAD7AOYA/QD9AOcA/gDoAOgA5wDlAC4CeAFQAT8BPQFTAT0BPQE9ATgBNwE3ATcBGwFXFgAwDwcAAFIeER0KHB0VAI0AlQClAFAAaR8CMAB1AG4AlgMSAyQxAx5IRU4wAJACTgDGAlYCoQC/ApMCkwKTApMCkwKTAogCkwKTApMCkwKTApMCkgKSApUCnQKUApMCkwKRApECkQKQAnIB0QKUApoCkwKTApIbfhACAPsKA5oCXgI3HAFRFToC3RYPMBgBSzwYUpYBeKlBAWZeAQIDPEwBAwCWMB4flnEAMGcAcAA1AJADm8yS8LWLYQzBMhXJARgIpNx7MQsEKmEBuQDkhYeGhYeFiImJhYqNi4WMj42HjomPiZCFkYWShZORlIWVhZaJl4WYhZmFmoWbipyPnYmehQCJK6cAigRCBD8EQQREBEIESARFBEAERgRIBEcEQwRFBEgAqgOOANBYANYCEwD9YQD9ASAA/QD7APsA/AD72wOLKmzFAP0A+wD7APwA+yMAkGEA/QCQASAA/QCQAvMA/QCQ2wOLKmzFIwD+YQEgAP0A/QD7APsA/AD7AP4A+wD7APwA+9sDiypsxSMAkGEBIAD9AJAA/QCQAvMA/QCQ2wOLKmzFIwJKAT0CUQFAAlLIA6UC8wOl2wOLKmzFIwCQYQEgA6UAkAOlAJAC8wOlAJDbA4sqbMUjBDcAkAQ4AJANlDh0JwEzAJAHRXUKKgEEAM1hCQBbYQAFGjkJAJAJRN8AUAkAkAkAnW0/6mOd3brkH5dB9mNQ/eNThoJ1CP8EZzy46pMulzRpOAZDJDXL2yXaVtAh1MxM82zfnsL/FXSaOaxJlgv345IW0Dfon3fzkx0WByY6wfCroENsWq/bORcfBvtlWbGzP5ju+gqE1DjyFssbkkSeqLAdrCkLOfItA7XNe1PctDPFKoNd/aZ6IQq6JTB6IrDBZ5/nJIbTHMeaaIWRoDvc42ORs9KtvcQWZd+Nv1D2C/hrzaOrFUjpItLWRI4x3GmzQqZbVH5LoCEJpk3hzt1pmM7bPitwOPG8gTKLVFszSrDZyLmfq8LkwkSUhIQlN4nFJUEhU2N7NBTOGk4Y2q9A2M7ps8jcevOKfycp9u3DyCe9hCt7i5HV8U5pm5LnVnKnyzbIyAN/LU4aqT3JK+e9JsdusAsUCgAuCnc4IwbgPBg4EPGOv5gR8D+96c8fLb09f7L6ON2k+Zxe/Y0AYoZIZ8yuu1At7f70iuSFoFmyPpwDU/4lQ+mHkFmq/CwtE7A979KNdD8zaHSx4HoxWsM8vl+2brNxN0QtIUvOfNGAYyv1R5DaM1JAR0C+Ugp6/cNq4pUDyDPKJjFeP4/L1TBoOJak3PVlmDCi/1oF8k1mnzTCz15BdAvmFjQrjide74m2NW1NG/qRrzhbNwwejlhnPfRn4mIfYmXzj5Fbu3C2TUpnYg+djp65dxZJ8XhwUqJ8JYrrR4WtrHKdKjz0i77K+QitukOAZSfFIwvBr1GKYpSukYTqF4gNtgaNDqh78ZDH4Qerglo3VpTLT0wOglaX6bDNhfs04jHVcMfCHwIb+y5bAaBvh2RARFYEjxjr1xTfU09JEjdY1vfcPrPVmnBBSDPj9TcZ1V/Dz8fvy0WLWZM0JPbRL0hLSPeVoC8hgQIGaeE6AYVZnnqm62/wt00pDl5Nw/nDo+bF1tC4qo5DryXVn8ffL3kuT51e+VcBTGiibvP+vqX50dppfxyNORSr48S5WXV8fzcsgjRQH6zjl+nuUYFVloiEnZOPDpHD/7ILh3JuFCdvAi2ANXYXjTDA5Up6YLihbc7d+dBlI9+mdgr8m8+3/Dp26W/Jssn7b9/pOEP4i+/9TsPI9m2NfNKwEI35mqKV+HpZ+W69Y8sM/sIA9Ltvhd+evQTUUfSkYxki28/CBT0cT96HrlrSrE+V9RzhskX0CsDsCfHffBVybkxmHOFOgaUurWNQ2AcZbi1WjkZzYArWZBHFd1SYwtqQ0DIZt7OV40ewQxCr/LgxAc8dLJeAJFseWJq9XiOp21hLv/HhsFbYbg3zCR8JmonZjhuKYrS/KJc30vnOL2CM+GfogNWug2DstZPzauCNeeD8zlP8wxPyfLHYQB/J+wQE3aDpXH/5tdIQpLn3JXNJYZFiXInGB7FqxRxHYJ/re/lHprE5sngUMm11uOIA3bbtkk06I8DYxuwPD+e4sAeNfor0DkWmiCQFiNptkmiD2xGO1kIKGr/Tuu4bHe6z2NaS7Ih0c+Gpv+QbLY9ea122BXNSitM41sxUSlnWl+uJBIFoLqt66v/VfGIQos2lzhOOLDuScVxcyrqH3/FI4vaYB0b8gFHLXtxyX/9JpUCYNwlLZ1v5CeB99l0F795R5wl5UHRq1OYyKqsoIY07wJz2CT0TOf5/JRBPtJIIk5pOJ60SHayS9kMSKbI3fLLYztsY3B4MlSyoEfc9gL4yJVrPo+OGGunCK4p15UbCArJP/PQgUWDW4l+2P/tCqRRy2flIZL/nVeY/vyAfILUM5qEGfcFXXXrAit7skwDEFnD7mL1ATtyrz7HcodhzP7gShFhazIPm7X0+mTCeSWfrOr5WcvJfip19JRRLfXjuQpQjcNCuXo8kqkxQ68ukJQoxlnfjevc0WcKnGpUvyY54eJTS1IRWDqfHANukJLw56ts5yS6Nea7IrL6/78aKmZsch4Q694ujxgx5+0PhlGpzWimajpvkBOOUQlHLkJorzqu4e768L9nJtZWYturb7dsBxjzlNhd/gZcBuRgIUSdgZjg7Rx+f/zLcs4mAa3qDbJNUQVNbSg+dm0L3KH1uhesTPaErVYjZ8Isvfr+zfiX3DT0PlaOv+hdGvLUIlKSEcYHPMs0NtTGzyqMe74yciNFdAVZVzol/XtLsEqivKqfW7zWTCNCvZkPnnBlMv3UHW5RNNEJfuyR3MvYH/9E6gcts5GAwKIgCaBQ+V2Eh9O0IJkxFksPI1V9obqDKCpmPM55mLd+VQgRqgD+9XvsUxjbh/AXXPxOpc0FXFyJzc85aa1VQZa90LAWR4oinrBaOBr8DymCpFbdXMTn7Cv18S0hMR7T/o5VkRqN1g1/dvaDdZsRArO3bopkfee4efLF+hyVdcX4u3aNGTkWvLRafW+sXPktA1lla4UkSB7uJIULfxy/RAflk2miyw9xq9uVGgCNzqCv4iX+AUchfMkZdEgRZ9TZ+1CPTH2jXjMXjFl/+bEPzSjM7zPKKWhyZUgQG1lpp+DNz+Zz+85kD59q99U5R4B3vuI9WenCWqroy2U2Ruq6I+di5N/v9SmYnqJ5H1HLWCbIg6iVrn3s2gFBVFhrc1zzNqoFe275K3Jy1T0Mc5yeE1iRwO2b1L/j/S8jyvGDz6B3NMFEHErGHMM2+oJ5LobazyWEitdgMjQnsd0cjYrCqRpx8idpfwRq6hz/LleX6obpuJh/AGIu4sxD35hwkIEr5ShH8xro7tTDYK1GPHGylK6rp7NCG0lMr7YqwziMUBwXv0zPW667f3/IRLJRD7mkuwUP6mpkxyVjNlcBiAX12r//+WTuzWxsue7bsjRp7xFjpR2tRLqGHLvjYt3TpeybR82K61iLn+pOSWDfUv/HU8ecBtML+Gbz0v9vmlxSgZeBBzbGeP1KSqsH14ZM2kibgDhbS21hIALSOYFCE9LY+2CNvtzT2QuSJMiKP3zwvvs+/JkDwTg0jHVE0XH//U0nu5HKQtCL2KGDQYUgT7qIMVN/OoWqEz1oeG4wG7InZg47NE7rfHB2i7rkpYCUzaPfVtDYgTEPNpa8gXHI2Pp8A6YB8OYHkXDZMMcOL3rJD0Hxk+mRlsSJ12/7T52IcFst5zRc7uDJtQTXBdm9GvsvyXcBbMfKXWqsDSeEnFyPUXZGTafti4a0it8SN1qXxzBmzj+gVZ/FojNy+x73AuuqtJ/oaMZF6m5kbW6ItpfnUT/BrQunS+gLjTTUz0d8jTMpAfFQ40RQi9uM5qdFYzqk85hqSH1zsPOhiO5CN+hNZvL/RIs7m7LyLDuV80ZtyHHqVEngTVPBctHQhmcPjM30m1veDmHCXEpjybWAbgj3TqLUPNazzdHgxYmNuT7trWFcGOi7iTeL5YeK2yp2H98yoLN+skqhffZI/5n/ivceo44wJRY8bzC6DGwdgkMOulYhzW5m6OKyK2Mg+E3YE19L8ngE08TdAuNu0mIzd6kw0i03zzm4oqfVSZjZyxXnBhvt0v89EmnArya/UvHQrdQxBDAJagK2y+OqgBqzQ4FnUeiKfb7HFoUvFSknWhwq58TpBlVRZ0B0A7QWz7X4GLHcbdh5kFI/PKJ91OEh/kmnMEdh+Z23myFH8sXjR/KaHttrpz80N+bl0HM17RX48UjUWslrYHYW7oiHVgcGqTBoTrqK4JYwTTArFO1/APJ8DnEYf+wD92Dw15a9wrPxyJA88yYcv9RypzXLKAWmMuE0KAtIGjfKx1GbRQIq0AkttuRpBO7p4SGrTZuAOat3hTxXEcIKh3HgC1d88K7bz1+Jsi+y7tL/7zc0ZxCBB3hSxvP90GkUp1Lm2wuESafZyFy4Opir+o3gMWtDSuLF3LRHXTUGkKQtvARnwam8BuKv8Q2fHH/cEwPCQd3dhzgri8eTezRsQoGz6ha+S4E7ZzDB/LXwl04vA70NeVsf5rmv1TLvcQSNIBk3U6Qh6Bm+0905B91hopTLnTJRWZkUmbckEw0woG81azyw6LZaBL5Qx2HPvd3LHGLpN6mPZlto50NwW2zFOkgoPKV1gr142teD9aok2HNkPMepl3NIi78ShnAlJCzjZplteUoqz0+iUEOym1LZGGFHMBkc6/5f+sRCCFZZW6KrEby64o/ZfefQAPP6b5ko2fuujIv7uonIKXN6XiJsZmcOeGxteQ+b/ope3Z1HFeXYoW1AJrU/OiCpsyQP1Pr1BdQKFzS0oYnLCAweSnIh7qMFMRBMY7BcnJ5oskUbbRNiosqMzCYUAZPbo8tjCCsCBm5SoGcTHBMXcE+yQpl/OfBkcTw3oa4X7V+ohEh/Zkcv0cqc8sY40IsOW6lLiIrvYND/exZbRlOMgaHvb/QQKaY0k6Aamee2o3LVARCbIP4RoSd7u3CXkG+Iz6iFLfsN38F9xU4n3ueeVgiRs3jw70SMWu1QzDdiLsKtU1qvaLhv7dUbnLimdqYG+pa2aRZ8A6Q9JSr3yTs1MiAvfFHPQJTiqpI/hVUMmL6gPj6eL7lH0IkLCNcaogBA0TGfO0wO6ddf8Fju0L3YbRrWe8J3IewsNBCbpC2b6etQRJnSGLuWDiFoBez9hJHw6+bMQQGQS8YV/kzQ5AFHEqPaMgOjyR5zaHtlOBI4mjo8gdNItHUHQ7Bzq/E/xV1B+L0uoRcLIEj4hcv0yWQTwWLHzoFrvEZPygABpc4rnVjhfcBw5wOvaVVtgiG5qjklrTY1ZaXHkasyVYBd+lgo6zEHMumfK8XR2eD0cVn5w8l1uxGz2ACwtFob/CTV/TUx1kCKp+QROanLrNBiSPTxAf1eOFE+JifgAJ+pyrFqS/0wKlPWUVKlB2Bhu1Ggx2cvfdiR49VIsgBNnE75pf5lpFaQuz8+VPreUd/HLlW8kDSr25AnETsVRrOycLBPYD9/j/7Z0KKdOjtrM71AT+VsjD3D97aUDP5WrHp1DWghsk/lS/hp2VMwo0eqoEerLL/4/SlmyjStwWVDqF6jHC89niCwr1tMSe8GxeC9wjzMKmE7ZtdHOWqqc1OoTI24eVQc++crbyxSU4TxiB+vWoaAUpYQxZ06KKIPq6EvN/rN4DZ0/tQWYVqZ3FTIftPBfIuOWX3PonIKTUArpSvfmQRpkWD00wc3AQS98i4ZYaUbI+DGv90tuEKRjb2ocfdddC21YGUATYQmzelz7JqWBAQqKrWYdWEJlfPeRFZHtUm2MaISZsoOvURowxJKveGRegmBiKZ3d1cMFioJL33RoIKT0eDeK8FH/ybAhZU5TQIsWYmjyeT7EOLL5xZuRPf4qRIo6bbLtFOV6SX60fR8Smys/u1D5DjkmHJyr/woVAvBP2dxGo9gH1LgIm8XlFF1KSYvfj+0w7aTEfoFpcO+Jv3Ssbv8wwkED5JEC+jdln2dzToPNRtWiPbRb8f8G4aZX1j/2Vdbu7jM3gAVD5BKR+yJaOwLtwJodwjWu5di47tnNs9ahpnCUzVMObQfbTqMNs64MGANlgyihKjhwZ6p1Jsnro0/SfkOk6wx+HgUB6Mz9cUiF7KrJkhxnOVjCCcqPZglIojIRoDtkd2AkLNZC88GdP2qZV/1N6PBAe+fpgWZ36oHnewQ8CHdXcxbwQVjOn8U3qD9+e7FzWpg135vgdEMZ9fH5agDnNzdjKFZQ4tDsJs/S6Lk8FqjFJpHMjaRU6FI/DBDM0g+RRkxNoUvm14JAn5dgd6aVHt1aMkSXiJVenbm2FfrIEaFKHtm1erv1BJ5056ULL8AMGLmHav4yxg6F6n5oBq7bdP6zEr6f+QTDJ/KE1XfoG24JvVk2GL7Fb+me27otVFnq1e/2wEuqv6X+2zLQuJQszy5YJi/M5888fMy34L6z8ykD5sCHgzliAoAtEeoaFmnPT63kOYrZWspxYzqQBu/QKNyQ8e4QwKJUCVazmIUp6/zpLA3bWH2ch7QZN0rzWGxMRl3K1osWeETxL95TZSG/atM8LB9B92/71+g9UGWDPfD+lu/KdOQ85rocuHe91/gHA/iprG9PZ2juX49kaRxZ+1/sB3Ck35eWYBFsmCl0wC4QZWX5c5QMuSAEz1CJj0JWArSReV4D/vrgLw+EyhBB6aA4+B34PdlDaTLpm9q9Pkl+bzVWrSO+7uVrIECzsvk8RcmfmNSJretRcoI7ZcIfAqwciU9nJ8O4u1EgkcMOzC/MM2l6OYZRrGcqXCitp4LPXruVPzeD402JGV9grZyz9wJolMLC/YCcWs9CjiWv+DNRLaoSgD5M8T4PzmG8cXYM4jPo5SG1wY3QK/4wzVPrc33wI+AcGI//yXgvyBjocGrl768DMaYCGglwIit4r6t6ulwhwHJ4KeV3VHjspXXG4DIlDR2HNFvPaqkBViIvr433qZPuUINp6oi1LyVVC+EE1j6+wab8uPMeAo6e9uWYequvZynhnYazrvrDQJVkK3KZRoSR5BHi6vOC+AVCujMiQ1GVzGDZ4RFv8jFm7z5CU0iPH2JeXqUzqaKKP4P7osPkcIL99Y7fP3l+TzeFXO2kSpLIJW51oEY8DRIhqexGnxj0nmtGOseStuViIE2mJge45LENf77xjuI7egRNpzthNiajnuqikg0aQS1JqlIZf+hwSUlOp8BEQ0y3xiTOJkohBP3eyYiPDlZpFY88EWOpp4+hC/tQdhrQ56h2VJ2XA6vhPAbj+wH6iA2XYuTvRV25N8wNPQuA0Vzzem2ADZPFK2vr8l0I3GTV3fUN4S6FFYygW2Pu98f+lsgPf67rwVCbgMFAACW3P10GbxnK3SNuNK+VlPRiL7U3dK1o3spH/MFfDkgXuXjxDTxJrYctqHdwUg4rhUCNA13lGjuhJDatpFb/mExsBWS46aLFtROqVm8xQNPXK6A2rRfazJSWpIyh+FMmorXPXYnHQ7YLOmD4B5QTI8rzp7OomiarnaFs5syYjQ0ucc7g1/JzT446IFlDtpUL7DP9bLRCLJryUvi5R71/qX7ycqRSwunQ7+tfJz44Na3aJNszaMEZ/BV4iOGopabYdmvAPe+kIdGCNq5Q8fg8Ld0VNNXV0ZiiGej7zSA+pexy6wKC5k4rZa0k+qaN8bKq3oJWMQCSGaK7PrwMvA8t8BZTzjDqXcFTAIeRtl0SdlGSuAziVXItFcgAkeqwuNsbsrUZFcU6KUZLmvG415kHa0AwMFW2cNSUvPR0U9iCPh0nyslT92B5slYXiDWeSXvxHXItvjI8z5KCIVTIHqGZsbDBTr7WdHzcUAI1ipR86H3o0p2wPhfp7xg9oWOxWIK4a5BWdaV9OAPc0XuvlbwitCVtZDzZxGhIOl77ZgrRYR7LZQFE+Ih23hW3gI914ekkjgbKCi2bsqSAvij6GGj5p+k6evQtJp3qVh9vg+jiJvFCGcKBCITMWpqHZNKfE6IT0dKntS0rhu0DB5D9qIS0/RboNLsx2DlRMlx1QIBeBpHJNKdCL9uWM9eS7RJXKNOpraULtutuJYOl0apdE4LxfsyRSZb6fJkd51SHrI7lLB4vEg4fifJ1dqcWSeY4DgcyjrUcymK+gd3o+qj+3gHKWlLVdMUr3IeF8aClYBq+eeCV9Y7n1Ye8yL7rEvxY7jAlLwucKQ51pu59N8we8XwrbXPChBHXP4LnD3kDwQ85w1DKghtwvpO609fZOrPq8Q7GOOAjHhfR5VqvpoFne8oMHbCrWb1L0IdATo+h1PFeLLI8wc+FEyftLvskCdOtxKfAx3IEJXzBfWTKq5viKP/uu99dxnEpoNJhRtjSZGwOTWr7Ys44++P58O+nkYxd1Gcqm8G3Gh7AHSCxiPNyJWijI/lECrKrAXgBqkRShvdkd7IfoqUlziFDiglx+jdHnmRVmGnk3p/3n78M/HkzFUGZOS07cPnPn9jAnBWl4qDrB1ECf9idIKOdkJTKcZ690nuLW2yDsqwNpgrlT+wx2gv+Engha74lfVqbwqS15FRwuFDfq3bVCZcPy78TL2pH/DOdHeL9MFAtyybQNwHaO781rnJZAhR4M+AYWoSoa0EjQ99xivreM+FKwd7Jp/FC2vvvcq1z3RnRau/BM5KGkBPBSUBOzTNdfaJS/PWTDb1jRSgn2MuY3pVZbY9peHBVI3Ce/u70hg4f7MCVeAjYJfzTkDVLuB6jyjZs5Kko3u39ozgLK4LuwSbUrNIU5cl6Bs3De62AE084XRsm64Gs5W1ofxsWIZ9cYl8PNa5zQHl9ls5aiIKN0rHIIzBnLr03Kle2qq+n/gLDAzvF89vdZCvUFEHRoi9n33O3i49UWyeHP+ZAeRf+psM867nfqON092zE4Pj7AbLtvIUFJFr1y9Le0CL2flc7LUqbgGzOw4/q3vA/cJO5JeI8S+8bc1Y7pqYSzoEWSFn5G7EoPHTGHPMU6SeLKEeli+i8dHY3lWxSrIOU2y0TNo1SeRYewhVx05OXeVDf0xhHNckqp0arRk+bgToeSaHbVZ5nj3IH3m2oayt3sXY78qSPcDpc/5C7VXDRj6bROvvBG5JCsKl/yeMPAUn1flMsmr/FaFdb7gVUXnhLa+/Ilj87PpCC6rILQ6wkIP1ywEg0PztSEzbsJoRwQzDaxkiTN27YDnsy/YKfe6jKcqZWs64skzUAHIt+nXxju0dUVtbCSDAUXYw78Yd4bJKuYU8gbzLzgL4XIUC2HcPIVCUYvM7cybOBFVBdeGR4cOVB7QbGnohTRpiPrGqi1a8QXFBYqENawROuR43OG8dl+Jx4TpwAoi2kkPXW7b/ARSs4DO/z4H6oTIUpN3+/K6Iuc49C4/Uf1NxQTEE91VP8RnLKTpxjywMe2VxM1l4YGXSFY80HUAKIdqczBnnLMPklFV8mrr5hFDypn5TAT00ruU6AjDPNvncoVzX4ac6wAzTwrNH7oz1XLH1wzjQs5k7hcNLbznXQGB7M+rXxKtZXPrz1Ar+OxYGDkJvElknZsHD/IcxRd7ujmmLYpDDbverynroCnSKVQWEGjHL57PaI/WokvhYRpPMk4ni2EUhjDuIF+IU2R0fs40i+66bw8sz8OzyC2eFAxxicd2n5Juta2eWa9KtObD7xLmPvtK+8cjQt+NLjcZCTt+Ss9p1od0bklVgaIV1qJbWxUOr6iUzLDzFefYxAtyRcBr53IaDB25n60KQdhroQWMUpuWSUpELSFxiu4vgQeRoEZe78/ua3TlrszB8sLVZoecnV9YMYz+HkZA/pLqbFhzurB52Wl/WEM6sVk4q04OnzWZFi76JkcGgeeUyYUIwhCDMdIfTUdD4wQpYm3LBw0sp33CVK2q305jeyzgGnBzSMXjesm4XjcEhhrjPSLtwqqoaFCqD5DlHYhoTVafWtBUQXoNfDk19IFxq8sImCcqgMhOToIZUO2530aasY908dMX2nTMFjgv+lapdI8k/e0a7pFw6X3Tgf0m99bbCpOzVgRu2Dw/13CehVfFj+8BeKP6SZV4g/qiX42NWP568PzMajFm2ANmKtHjEIAIc2hc1iecBR9elGP4LmAQwAVmZT8kWc7JSY0ag583ch/Z16krGrjn2YdIaa22egy4/niU6m0WAG3K/yP65cfL//CP+JzcnoLHQFb/KJQeBrEbR1/IKo+YOFXWIQ8ghNxYdMwa49NeXzFqFOIXTmk3w/v5KneS8sGHiPGACh0DE9a1uLAochB79g3IqYObhlswemMucZnAE7dBkp5OAfToa5gHFbIPcec0fVWEOOLftQXsuffyv3wo1LWDDm+SyNMWgSEWtjMyYkjLjTkUtmj7DQlfbpHf38lDvoEN9d2ALxnWCjph4jvfEIRbHvltKbvE2BiYlz45mnJPeFrwZcBny3k0/pyXNrSbEIWvvZw14Y0Fqy4tba1Fu0yNNYaf47jfnz7VCCxKsrJz5oz3F8jXUdQqFu+gDq6EzvKDipXf/3NmcsCC74VB3OgHPgN7W9cU54pjGFDMfifl3m5Vhy21uk1U2nYCrddrifkpwGLYmLSSQAAjC6M3yB1fc6KHpgDnMXh2bYX2ns+Qma+DBgyCkZ0TqZK8Mp2Sryx7HdMM74X9hrwYhQbwlK+zgATAXRzQyS+hK4OTnP17/cyJ2WzY6DChYWGJYXGCnEdMswF5VTYQdSyTpdLXYuh+x2Qr7DR3H2x+YdP0qsLAzYJIWKwrrKkpBgWCmgNCn5t+QbWqf/LoLuvjgDFLtMoxNK5axIA9kammelvwh5ZI52ktrEm/OVEESPQPZGHAIhP7oWDBnGnuzG45XOTpZWsxwNO4UiyxH8riTvQq4JVq5GwX3yqVCbSR0ef/gVYDgiYaiD2EAAxuEPKyXTp/HhL96eVTpaDqFEoV2x1PP/UMcs/XqeGc1gZQG1ot6YxaIEWHanYavH9YdLFjlyU5yrYALVg/sxBjT39oD+BIXvf4LTbvvvpX3srxckEX1XAM9s2uajUTlpPq32mcx4T+sibdQEHQV2WmgwMhbYovh7WWTPfLF03ZbV5a+ElsSIyH6kgJ8+D6aN/6f+ZstkZOYZYx9GbagcrEqwNblz0iZ9NTyvIAeNn3Oup7rtyD4wVE0PoqcnR/LoSK1s1esmOGPjs3zHB8xW4iL8IrhqAJfsWNBYW9TGR11C3KZJaN7MP4O5Ykmpvw94hHzVmsYA68RQdFYfPlFOgCNBoSdy5ODcv11l9bLs135M4okEc4/e8hQczcz2PWipIVSBxa/5sr9xyTFbjG4xm8f4LmrAhD1uEDGrFDl/6X7Nw7/WZPW7fZJGYN8eZ68Td5KGfJyKjD+pTysvTi+8Q8R0L9wKAxAUrYswdvAuiNeenxSplQZjYTxbcH/wP97fOY215SozY3UDRhv7lomztURB2O2UriTX3oAiTKoInkHQietZyhBQ9wMTVHgMrxOP5T/0gN14eFTz0m2D6/iJMbXYGHdIkKEGV2Voa8k/hVNvAVAZKrDEXthUxotwYkYysTDk8j27XEVy+4a30jopuAp5+/xWYb0ne6lwKZwR3j6kDXroOOtrHqWlkJHSWLoPEQJQo/ARzR8UBZSckmeBPn3gJwY62Zo2dyy1AyRRDQBFAJKH9KX+7auP8U8XDo7mMSzq5ZxmaJ5bLpNg4ZM7938SAjMHcu1yB4+lkHnVLnIp86AOPgigH+ZFDRq1QuKWK3pK5JkLDJdakj176NCbjXDASt1h/t1p+GHyKbAoevHSnHuPfoBmQ3nJrDjOhPfwVYi8V5r0KB8BsrfFu8BvhYCbNrvCVnd4Q8RktqIR/ZilioC6g3++L7PHzuXa8NFSF5zd+ISzGLTjrfaKXsBFCkkK0ksSDbl91yXUghMFOskQBeUoo7o3wuIsE29goRIORuJ4b1jSumvR0gR8B21iyW1G4FqHkZOlWz9zq5FnaJX1WbeAxe2DfGSAnw4cqDwg3LFalk6eH89Sdc41Fr6voEa0hfwdkb54yOM7WevDugT1FRzEqdg9zZZ44ZAKGH3ZyqFve3SE4UDN6tLmIFTdIwMrtYRXWBQDB7vvqOuYj7cN31av64+jg/g1uce+am3TOl0cUUL6s0l35FJ9p8vJcG+G8lAFqC0pdmd/aaWYpqDLvB5LEasLMgbPN2N+Wvkh6HYxPOrZEfoxQX/67AzcWOR0K3eYGOgQhyWL7cwKGlxmY/E2b8CKi6Ssgok+7B+zTtq/DXmaDAHRnwbwvCDJ9pITO5RQgBuprEWT0avZv7QjbzITYD8Fzgy4TSYG3z9tLso0Z7MfgHDLKU+kHrzxWkBPwJRydKMXG4AaCA7mlAmjzpNhGOrMGZGZlHSjPbmO5jPd/lKBrViZ0BaXMmqaFOwA/f03O04qQX6MSVA37+SA5Pne/KP7caLJKuOCJXoXpzArUrYesMVc/RXnOv03YrwKgPlR2SjpqIycyulmodZBy6gVc1jA9y6lJqWgR6SY6tc24sVcYuh2GaTeikYJnhr2d6BiL3oLx8M8wuJBdI3FRVIIAx4XougScOw2xWgwUoSYKeLUHc310kVBzSE/vFeHAjlUil8KZftctMgwGjwrhMbjDbK4rB32fTe9jnsqijdp5kOwkD9+klel+lNh3joAFQ');
const FENCED = new Map([[8217,"apostrophe"],[8260,"fraction slash"],[12539,"middle dot"]]);

function hex_cp(cp) {
	return cp.toString(16).toUpperCase().padStart(2, '0');
}

function quote_cp(cp) {
	return `{${hex_cp(cp)}}`; // raffy convention: like "\u{X}" w/o the "\u"
}

/*
export function explode_cp(s) {
	return [...s].map(c => c.codePointAt(0));
}
*/
function explode_cp(s) { // this is about 2x faster
	let cps = [];
	for (let pos = 0, len = s.length; pos < len; ) {
		let cp = s.codePointAt(pos);
		pos += cp < 0x10000 ? 1 : 2;
		cps.push(cp);
	}
	return cps;
}

function str_from_cps(cps) {
	const chunk = 4096;
	let len = cps.length;
	if (len < chunk) return String.fromCodePoint(...cps);
	let buf = [];
	for (let i = 0; i < len; ) {
		buf.push(String.fromCodePoint(...cps.slice(i, i += chunk)));
	}
	return buf.join('');
}

function compare_arrays(a, b) {
	let n = a.length;
	let c = n - b.length;
	for (let i = 0; c == 0 && i < n; i++) c = a[i] - b[i];
	return c;
}

// reverse polyfill

function nf(cps, form) {
	return explode_cp(str_from_cps(cps).normalize(form));
}

function nfc(cps) {
	return nf(cps, 'NFC');
}
function nfd(cps) {
	return nf(cps, 'NFD');
}

//const t0 = performance.now();

const STOP = 0x2E;
const FE0F = 0xFE0F;
const STOP_CH = '.';
const UNIQUE_PH = 1;
const HYPHEN = 0x2D;

function read_set() {
	return new Set(read_sorted(r));
}
const MAPPED = new Map(read_mapped(r)); 
const IGNORED = read_set(); // ignored characters are not valid, so just read raw codepoints
/*
// direct include from payload is smaller that the decompression code
const FENCED = new Map(read_array_while(() => {
	let cp = r();
	if (cp) return [cp, read_str(r())];
}));
*/
const CM = read_set();
const ESCAPE = read_set(); // characters that should not be printed
const NFC_CHECK = read_set();
const CHUNKS = read_sorted_arrays(r);
function read_chunked() {
	// deduplicated sets + uniques
	return new Set([read_sorted(r).map(i => CHUNKS[i]), read_sorted(r)].flat(2));
}
const UNRESTRICTED = r();
const GROUPS = read_array_while(i => {
	// minifier property mangling seems unsafe
	// so these are manually renamed to single chars
	let N = read_array_while(r).map(x => x+0x60);
	if (N.length) {
		let R = i >= UNRESTRICTED; // first arent restricted
		N[0] -= 32; // capitalize
		N = str_from_cps(N);
		if (R) N=`Restricted[${N}]`;
		let P = read_chunked(); // primary
		let Q = read_chunked(); // secondary
		let V = [...P, ...Q].sort((a, b) => a-b); // derive: sorted valid
		let M = r()-1; // combining mark
		// code currently isn't needed
		/*if (M < 0) { // whitelisted
			M = new Map(read_array_while(() => {
				let i = r();
				if (i) return [V[i-1], read_array_while(() => {
					let v = read_array_while(r);
					if (v.length) return v.map(x => x-1);
				})];
			}));
		}*/
		return {N, P, M, R, V: new Set(V)};
	}
});
const WHOLE_VALID = read_set();
const WHOLE_MAP = new Map();
// decode compressed wholes
[...WHOLE_VALID, ...read_set()].sort((a, b) => a-b).map((cp, i, v) => {
	let d = r(); 
	let w = v[i] = d ? v[i-d] : {V: [], M: new Map()};
	w.V.push(cp); // add to member set
	if (!WHOLE_VALID.has(cp)) {
		WHOLE_MAP.set(cp, w);  // register with whole map
	}
});
// compute confusable-extent complements
for (let {V, M} of new Set(WHOLE_MAP.values())) {
	// connect all groups that have each whole character
	let recs = [];
	for (let cp of V) {
		let gs = GROUPS.filter(g => g.V.has(cp));
		let rec = recs.find(({G}) => gs.some(g => G.has(g)));
		if (!rec) {
			rec = {G: new Set(), V: []};
			recs.push(rec);
		}
		rec.V.push(cp);
		gs.forEach(g => rec.G.add(g));
	}
	// per character cache groups which are not a member of the extent
	let union = recs.flatMap(({G}) => [...G]);
	for (let {G, V} of recs) {
		let complement = new Set(union.filter(g => !G.has(g)));
		for (let cp of V) {
			M.set(cp, complement);
		}
	}
}
let union = new Set(); // exists in 1+ groups
let multi = new Set(); // exists in 2+ groups
for (let g of GROUPS) {
	for (let cp of g.V) {
		(union.has(cp) ? multi : union).add(cp);
	}
}
// dual purpose WHOLE_MAP: return placeholder if unique non-confusable
for (let cp of union) {
	if (!WHOLE_MAP.has(cp) && !multi.has(cp)) {
		WHOLE_MAP.set(cp, UNIQUE_PH);
	}
}
const VALID = new Set([...union, ...nfd(union)]); // possibly valid

// decode emoji
const EMOJI_SORTED = read_sorted(r);
//const EMOJI_SOLO = new Set(read_sorted(r).map(i => EMOJI_SORTED[i])); // not needed
const EMOJI_ROOT = read_emoji_trie([]);
function read_emoji_trie(cps) {
	let B = read_array_while(() => {
		let keys = read_sorted(r).map(i => EMOJI_SORTED[i]);
		if (keys.length) return read_emoji_trie(keys);
	}).sort((a, b) => b.Q.size - a.Q.size); // sort by likelihood
	let temp = r();
	let V = temp % 3; // valid (0 = false, 1 = true, 2 = weird)
	temp = (temp / 3)|0;
	let F = temp & 1; // allow FE0F
	temp >>= 1;
	let S = temp & 1; // save
	let C = temp & 2; // check
	return {B, V, F, S, C, Q: new Set(cps)};
}
//console.log(performance.now() - t0);

// free tagging system
class Emoji extends Array {
	get is_emoji() { return true; }
}

// create a safe to print string 
// invisibles are escaped
// leading cm uses placeholder
function safe_str_from_cps(cps, quoter = quote_cp) {
	//if (Number.isInteger(cps)) cps = [cps];
	//if (!Array.isArray(cps)) throw new TypeError(`expected codepoints`);
	let buf = [];
	if (is_combining_mark(cps[0])) buf.push('◌');
	let prev = 0;
	let n = cps.length;
	for (let i = 0; i < n; i++) {
		let cp = cps[i];
		if (should_escape(cp)) {
			buf.push(str_from_cps(cps.slice(prev, i)));
			buf.push(quoter(cp));
			prev = i + 1;
		}
	}
	buf.push(str_from_cps(cps.slice(prev, n)));
	return buf.join('');
}

// if escaped: {HEX}
//       else: "x" {HEX}
function quoted_cp(cp) {
	return (should_escape(cp) ? '' : `"${safe_str_from_cps([cp])}" `) + quote_cp(cp);
}

function check_label_extension(cps) {
	if (cps.length >= 4 && cps[2] == HYPHEN && cps[3] == HYPHEN) {
		throw new Error('invalid label extension');
	}
}
function check_leading_underscore(cps) {
	const UNDERSCORE = 0x5F;
	for (let i = cps.lastIndexOf(UNDERSCORE); i > 0; ) {
		if (cps[--i] !== UNDERSCORE) {
			throw new Error('underscore allowed only at start');
		}
	}
}
// check that a fenced cp is not leading, trailing, or touching another fenced cp
function check_fenced(cps) {
	let cp = cps[0];
	let prev = FENCED.get(cp);
	if (prev) throw error_placement(`leading ${prev}`);
	let n = cps.length;
	let last = -1;
	for (let i = 1; i < n; i++) {
		cp = cps[i];
		let match = FENCED.get(cp);
		if (match) {
			if (last == i) throw error_placement(`${prev} + ${match}`);
			last = i + 1;
			prev = match;
		}
	}
	if (last == n) throw error_placement(`trailing ${prev}`);
}

// note: set(s) cannot be exposed because they can be modified
function is_combining_mark(cp) {
	return CM.has(cp);
}
function should_escape(cp) {
	return ESCAPE.has(cp);
}

function ens_normalize_fragment(frag, decompose) {
	let nf = decompose ? nfd : nfc;
	return frag.split(STOP_CH).map(label => str_from_cps(process(explode_cp(label), nf).flatMap(x => x.is_emoji ? filter_fe0f(x) : x))).join(STOP_CH);
}

function ens_normalize(name) {
	return flatten(ens_split(name));
}

function ens_beautify(name) {
	let split = ens_split(name, true);
	// this is experimental
	for (let {type, output, error} of split) {
		if (error) continue;

		// replace leading/trailing hyphen
		// 20230121: consider beautifing all or leading/trailing hyphen to unicode variant
		// not exactly the same in every font, but very similar: "-" vs "‐"
		/*
		const UNICODE_HYPHEN = 0x2010;
		// maybe this should replace all for visual consistancy?
		// `node tools/reg-count.js regex ^-\{2,\}` => 592
		//for (let i = 0; i < output.length; i++) if (output[i] == 0x2D) output[i] = 0x2010;
		if (output[0] == HYPHEN) output[0] = UNICODE_HYPHEN;
		let end = output.length-1;
		if (output[end] == HYPHEN) output[end] = UNICODE_HYPHEN;
		*/
		// 20230123: WHATWG URL uses "CheckHyphens" false
		// https://url.spec.whatwg.org/#idna

		// ξ => Ξ if not greek
		if (type !== 'Greek') { 
			let prev = 0;
			while (true) {
				let next = output.indexOf(0x3BE, prev);
				if (next < 0) break;
				output[next] = 0x39E; 
				prev = next + 1;
			}
		}

		// 20221213: fixes bidi subdomain issue, but breaks invariant (200E is disallowed)
		// could be fixed with special case for: 2D (.) + 200E (LTR)
		//output.splice(0, 0, 0x200E);
	}
	return flatten(split);
}

function ens_split(name, preserve_emoji) {
	let offset = 0;
	// https://unicode.org/reports/tr46/#Validity_Criteria 4.1 Rule 4
	// "The label must not contain a U+002E ( . ) FULL STOP."
	return name.split(STOP_CH).map(label => {
		let input = explode_cp(label);
		let info = {
			input,
			offset, // codepoint, not substring!
		};
		offset += input.length + 1; // + stop
		let norm;
		try {
			let tokens = info.tokens = process(input, nfc); // if we parse, we get [norm and mapped]
			let token_count = tokens.length;
			let type;
			if (!token_count) { // the label was effectively empty (could of had ignored characters)
				// 20230120: change to strict
				// https://discuss.ens.domains/t/ens-name-normalization-2nd/14564/59
				//norm = [];
				//type = 'None'; // use this instead of next match, "ASCII"
				throw new Error(`empty label`);
			} else {
				let chars = tokens[0];
				let emoji = token_count > 1 || chars.is_emoji;
				if (!emoji && chars.every(cp => cp < 0x80)) { // special case for ascii
					norm = chars;
					check_leading_underscore(norm);
					// only needed for ascii
					// 20230123: matches matches WHATWG, see note 3.3
					check_label_extension(norm);
					// cant have fenced
					// cant have cm
					// cant have wholes
					// see derive: assert ascii fast path
					type = 'ASCII';
				} else {
					if (emoji) { // there is at least one emoji
						info.emoji = true; 
						chars = tokens.flatMap(x => x.is_emoji ? [] : x); // all of the nfc tokens concat together
					}
					norm = tokens.flatMap(x => !preserve_emoji && x.is_emoji ? filter_fe0f(x) : x);
					check_leading_underscore(norm);
					if (!chars.length) { // theres no text, just emoji
						type = 'Emoji';
					} else {
						if (CM.has(norm[0])) throw error_placement('leading combining mark');
						for (let i = 1; i < token_count; i++) { // we've already checked the first token
							let cps = tokens[i];
							if (!cps.is_emoji && CM.has(cps[0])) { // every text token has emoji neighbors, eg. EtEEEtEt...
								throw error_placement(`emoji + combining mark: "${str_from_cps(tokens[i-1])} + ${safe_str_from_cps([cps[0]])}"`);
							}
						}
						check_fenced(norm);
						let unique = [...new Set(chars)];
						let [g] = determine_group(unique); // take the first match
						// see derive: "Matching Groups have Same CM Style"
						// alternative: could form a hybrid type: Latin/Japanese/...	
						check_group(g, chars); // need text in order
						check_whole(g, unique); // only need unique text (order would be required for multiple-char confusables)
						type = g.N;
						// 20230121: consider exposing restricted flag
						// it's simpler to just check for 'Restricted'
						// or even better: type.endsWith(']')
						//if (g.R) info.restricted = true;
					}
				}
			}
			info.type = type;
		} catch (err) {
			info.error = err; // use full error object
		}
		info.output = norm;
		return info;
	});
}

function check_whole(group, unique) {
	let maker;
	let shared = []; // TODO: can this be avoided?
	for (let cp of unique) {
		let whole = WHOLE_MAP.get(cp);
		if (whole === UNIQUE_PH) return; // unique, non-confusable
		if (whole) {
			let set = whole.M.get(cp); // groups which have a character that look-like this character
			maker = maker ? maker.filter(g => set.has(g)) : [...set];
			if (!maker.length) return; // confusable intersection is empty
		} else {
			shared.push(cp); 
		}
	}
	if (maker) {
		// we have 1+ confusable
		// check if any of the remaning groups
		// contain the shared characters too
		for (let g of maker) {
			if (shared.every(cp => g.V.has(cp))) {
				throw new Error(`whole-script confusable: ${group.N}/${g.N}`);
			}
		}
	}
}

// assumption: unique.size > 0
// returns list of matching groups
function determine_group(unique) {
	let groups = GROUPS;
	for (let cp of unique) {
		// note: we need to dodge CM that are whitelisted
		// but that code isn't currently necessary
		let gs = groups.filter(g => g.V.has(cp));
		if (!gs.length) {
			if (groups === GROUPS) {
				// the character was composed of valid parts
				// but it's NFC form is invalid
				throw error_disallowed(cp); // this should be rare
			} else {
				// there is no group that contains all these characters
				// throw using the highest priority group that matched
				// https://www.unicode.org/reports/tr39/#mixed_script_confusables
				throw error_group_member(groups[0], cp);
			}
		}
		groups = gs;
		if (gs.length == 1) break; // there is only one group left
	}
	// there are at least 1 group(s) with all of these characters
	return groups;
}

// throw on first error
function flatten(split) {
	return split.map(({input, error, output}) => {
		if (error) {
			// don't print label again if just a single label
			let msg = error.message;
			throw new Error(split.length == 1 ? msg : `Invalid label "${safe_str_from_cps(input)}": ${msg}`);
		}
		return str_from_cps(output);
	}).join(STOP_CH);
}


function error_disallowed(cp) {
	// TODO: add cp to error?
	return new Error(`disallowed character: ${quoted_cp(cp)}`); 
}
function error_group_member(g, cp) {
	let quoted = quoted_cp(cp);
	let gg = GROUPS.find(g => g.P.has(cp));
	if (gg) {
		quoted = `${gg.N} ${quoted}`;
	}
	return new Error(`illegal mixture: ${g.N} + ${quoted}`);
}
function error_placement(where) {
	return new Error(`illegal placement: ${where}`);
}

// assumption: cps.length > 0
// assumption: cps[0] isn't a CM
function check_group(g, cps) {
	let {V, M} = g;
	for (let cp of cps) {
		if (!V.has(cp)) {
			throw error_group_member(g, cp);
		}
	}
	if (M >= 0) {
		// we know it can't be cm leading
		// we know the previous character isn't an emoji
		let decomposed = nfd(cps);
		for (let i = 1, e = decomposed.length; i < e; i++) {
			if (CM.has(cps[i])) {
				let j = i + 1;
				while (j < e && CM.has(cps[j])) j++;
				if (j - i > M) {
					throw new Error(`too many combining marks: ${g.N} "${str_from_cps(cps.slice(i-1, j))}" (${j-i}/${M})`);
				}
				i = j;
			}
		}
	}
	// *** this code currently isn't needed ***
	/*
	let cm_whitelist = M instanceof Map;
	for (let i = 0, e = cps.length; i < e; ) {
		let cp = cps[i++];
		let seqs = cm_whitelist && M.get(cp);
		if (seqs) { 
			// list of codepoints that can follow
			// if this exists, this will always be 1+
			let j = i;
			while (j < e && CM.has(cps[j])) j++;
			let cms = cps.slice(i, j);
			let match = seqs.find(seq => !compare_arrays(seq, cms));
			if (!match) throw new Error(`disallowed combining mark sequence: "${safe_str_from_cps([cp, ...cms])}"`);
			i = j;
		} else if (!V.has(cp)) {
			// https://www.unicode.org/reports/tr39/#mixed_script_confusables
			let quoted = quoted_cp(cp);
			for (let cp of cps) {
				let u = UNIQUE.get(cp);
				if (u && u !== g) {
					// if both scripts are restricted this error is confusing
					// because we don't differentiate RestrictedA from RestrictedB 
					if (!u.R) quoted = `${quoted} is ${u.N}`;
					break;
				}
			}
			throw new Error(`disallowed ${g.N} character: ${quoted}`);
			//throw new Error(`disallowed character: ${quoted} (expected ${g.N})`);
			//throw new Error(`${g.N} does not allow: ${quoted}`);
		}
	}
	if (!cm_whitelist) {
		let decomposed = nfd(cps);
		for (let i = 1, e = decomposed.length; i < e; i++) { // we know it can't be cm leading
			if (CM.has(cps[i])) {
				let j = i + 1;
				while (j < e && CM.has(cps[j])) j++;
				if (j - i > M) {
					throw new Error(`too many combining marks: "${str_from_cps(cps.slice(i-1, j))}" (${j-i}/${M})`);
				}
				i = j;
			}
		}
	}
	*/
}

// given a list of codepoints
// returns a list of lists, where emoji are a fully-qualified (as Array subclass)
// eg. explode_cp("abc💩d") => [[61, 62, 63], Emoji[1F4A9, FE0F], [64]]
function process(input, nf) {
	let ret = [];
	let chars = [];
	input = input.slice().reverse(); // flip so we can pop
	while (input.length) {
		let emoji = consume_emoji_reversed(input);
		if (emoji) {
			if (chars.length) {
				ret.push(nf(chars));
				chars = [];
			}
			ret.push(emoji);
		} else {
			let cp = input.pop();
			if (VALID.has(cp)) {
				chars.push(cp);
			} else {
				let cps = MAPPED.get(cp);
				if (cps) {
					chars.push(...cps);
				} else if (!IGNORED.has(cp)) {
					throw error_disallowed(cp);
				}
			}
		}
	}
	if (chars.length) {
		ret.push(nf(chars));
	}
	return ret;
}

function filter_fe0f(cps) {
	return cps.filter(cp => cp != FE0F);
}

// given array of codepoints
// returns the longest valid emoji sequence (or undefined if no match)
// *MUTATES* the supplied array
// allows optional FE0F
// disallows interleaved ignored characters
// fills (optional) eaten array with matched codepoints
function consume_emoji_reversed(cps, eaten) {
	let node = EMOJI_ROOT;
	let emoji;
	let saved;
	let stack = [];
	let pos = cps.length;
	if (eaten) eaten.length = 0; // clear input buffer (if needed)
	while (pos) {
		let cp = cps[--pos];
		node = node.B.find(x => x.Q.has(cp));
		if (!node) break;
		if (node.S) { // remember
			saved = cp;
		} else if (node.C) { // check exclusion
			if (cp === saved) break;
		}
		stack.push(cp);
		if (node.F) {
			stack.push(FE0F);
			if (pos > 0 && cps[pos - 1] == FE0F) pos--; // consume optional FE0F
		}
		if (node.V) { // this is a valid emoji (so far)
			emoji = conform_emoji_copy(stack, node);
			if (eaten) eaten.push(...cps.slice(pos).reverse()); // copy input (if needed)
			cps.length = pos; // truncate
		}
	}
	/*
	// *** this code currently isn't needed ***
	if (!emoji) {
		let cp = cps[cps.length-1];
		if (EMOJI_SOLO.has(cp)) {
			if (eaten) eaten.push(cp);
			emoji = Emoji.of(cp);
			cps.pop();
		}
	}
	*/
	return emoji;
}

// create a copy and fix any unicode quirks
function conform_emoji_copy(cps, node) {
	let copy = Emoji.from(cps); // copy stack
	if (node.V == 2) copy.splice(1, 1); // delete FE0F at position 1 (see: make.js)
	return copy;
}

// return all supported emoji as fully-qualified emoji 
// ordered by length then lexicographic 
function ens_emoji() {
	// *** this code currently isn't needed ***
	//let ret = [...EMOJI_SOLO].map(x => [x]);
	let ret = [];
	build(EMOJI_ROOT, []);
	return ret.sort(compare_arrays);
	function build(node, cps, saved) {
		if (node.S) { 
			saved = cps[cps.length-1];
		} else if (node.C) { 
			if (saved === cps[cps.length-1]) return;
		}
		if (node.F) cps.push(FE0F);
		if (node.V) ret.push(conform_emoji_copy(cps, node));
		for (let br of node.B) {
			for (let cp of br.Q) {
				build(br, [...cps, cp], saved);
			}
		}
	}
}

// ************************************************************
// tokenizer 

const TY_VALID = 'valid';
const TY_MAPPED = 'mapped';
const TY_IGNORED = 'ignored';
const TY_DISALLOWED = 'disallowed';
const TY_EMOJI = 'emoji';
const TY_NFC = 'nfc';
const TY_STOP = 'stop';

function ens_tokenize(name, {
	nf = true, // collapse unnormalized runs into a single token
} = {}) {
	let input = explode_cp(name).reverse();
	let eaten = [];
	let tokens = [];
	while (input.length) {		
		let emoji = consume_emoji_reversed(input, eaten);
		if (emoji) {
			tokens.push({type: TY_EMOJI, emoji, input: eaten.slice(), cps: filter_fe0f(emoji)});
		} else {
			let cp = input.pop();
			if (cp == STOP) {
				tokens.push({type: TY_STOP, cp});
			} else if (VALID.has(cp)) {
				tokens.push({type: TY_VALID, cps: [cp]});
			} else if (IGNORED.has(cp)) {
				tokens.push({type: TY_IGNORED, cp});
			} else {
				let cps = MAPPED.get(cp);
				if (cps) {
					tokens.push({type: TY_MAPPED, cp, cps: cps.slice()});
				} else {
					tokens.push({type: TY_DISALLOWED, cp});
				}
			}
		}
	}
	if (nf) {
		for (let i = 0, start = -1; i < tokens.length; i++) {
			let token = tokens[i];
			if (is_valid_or_mapped(token.type)) {
				if (requires_check(token.cps)) { // normalization might be needed
					let end = i + 1;
					for (let pos = end; pos < tokens.length; pos++) { // find adjacent text
						let {type, cps} = tokens[pos];
						if (is_valid_or_mapped(type)) {
							if (!requires_check(cps)) break;
							end = pos + 1;
						} else if (type !== TY_IGNORED) { // || type !== TY_DISALLOWED) { 
							break;
						}
					}
					if (start < 0) start = i;
					let slice = tokens.slice(start, end);
					let cps0 = slice.flatMap(x => is_valid_or_mapped(x.type) ? x.cps : []); // strip junk tokens
					let cps = nfc(cps0);
					if (compare_arrays(cps, cps0)) { // bundle into an nfc token
						tokens.splice(start, end - start, {
							type: TY_NFC, 
							input: cps0, // there are 3 states: tokens0 ==(process)=> input ==(nfc)=> tokens/cps
							cps, 
							tokens0: collapse_valid_tokens(slice),
							tokens: ens_tokenize(str_from_cps(cps), {nf: false})
						});
						i = start;
					} else { 
						i = end - 1; // skip to end of slice
					}
					start = -1; // reset
				} else {
					start = i; // remember last
				}
			} else if (token.type !== TY_IGNORED) { // 20221024: is this correct?
				start = -1; // reset
			}
		}
	}
	return collapse_valid_tokens(tokens);
}

function is_valid_or_mapped(type) {
	return type == TY_VALID || type == TY_MAPPED;
}

function requires_check(cps) {
	return cps.some(cp => NFC_CHECK.has(cp));
}

function collapse_valid_tokens(tokens) {
	for (let i = 0; i < tokens.length; i++) {
		if (tokens[i].type == TY_VALID) {
			let j = i + 1;
			while (j < tokens.length && tokens[j].type == TY_VALID) j++;
			tokens.splice(i, j - i, {type: TY_VALID, cps: tokens.slice(i, j).flatMap(x => x.cps)});
		}
	}
	return tokens;
}




/***/ }),

/***/ "./node_modules/@noble/hashes/esm/_assert.js":
/*!***************************************************!*\
  !*** ./node_modules/@noble/hashes/esm/_assert.js ***!
  \***************************************************/
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "bool": () => (/* binding */ bool),
/* harmony export */   "bytes": () => (/* binding */ bytes),
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__),
/* harmony export */   "exists": () => (/* binding */ exists),
/* harmony export */   "hash": () => (/* binding */ hash),
/* harmony export */   "number": () => (/* binding */ number),
/* harmony export */   "output": () => (/* binding */ output)
/* harmony export */ });
function number(n) {
    if (!Number.isSafeInteger(n) || n < 0)
        throw new Error(`Wrong positive integer: ${n}`);
}
function bool(b) {
    if (typeof b !== 'boolean')
        throw new Error(`Expected boolean, not ${b}`);
}
function bytes(b, ...lengths) {
    if (!(b instanceof Uint8Array))
        throw new TypeError('Expected Uint8Array');
    if (lengths.length > 0 && !lengths.includes(b.length))
        throw new TypeError(`Expected Uint8Array of length ${lengths}, not of length=${b.length}`);
}
function hash(hash) {
    if (typeof hash !== 'function' || typeof hash.create !== 'function')
        throw new Error('Hash should be wrapped by utils.wrapConstructor');
    number(hash.outputLen);
    number(hash.blockLen);
}
function exists(instance, checkFinished = true) {
    if (instance.destroyed)
        throw new Error('Hash instance has been destroyed');
    if (checkFinished && instance.finished)
        throw new Error('Hash#digest() has already been called');
}
function output(out, instance) {
    bytes(out);
    const min = instance.outputLen;
    if (out.length < min) {
        throw new Error(`digestInto() expects output buffer of length at least ${min}`);
    }
}
const assert = {
    number,
    bool,
    bytes,
    hash,
    exists,
    output,
};
/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (assert);


/***/ }),

/***/ "./node_modules/@noble/hashes/esm/_sha2.js":
/*!*************************************************!*\
  !*** ./node_modules/@noble/hashes/esm/_sha2.js ***!
  \*************************************************/
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "SHA2": () => (/* binding */ SHA2)
/* harmony export */ });
/* harmony import */ var _assert_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./_assert.js */ "./node_modules/@noble/hashes/esm/_assert.js");
/* harmony import */ var _utils_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./utils.js */ "./node_modules/@noble/hashes/esm/utils.js");


// Polyfill for Safari 14
function setBigUint64(view, byteOffset, value, isLE) {
    if (typeof view.setBigUint64 === 'function')
        return view.setBigUint64(byteOffset, value, isLE);
    const _32n = BigInt(32);
    const _u32_max = BigInt(0xffffffff);
    const wh = Number((value >> _32n) & _u32_max);
    const wl = Number(value & _u32_max);
    const h = isLE ? 4 : 0;
    const l = isLE ? 0 : 4;
    view.setUint32(byteOffset + h, wh, isLE);
    view.setUint32(byteOffset + l, wl, isLE);
}
// Base SHA2 class (RFC 6234)
class SHA2 extends _utils_js__WEBPACK_IMPORTED_MODULE_1__.Hash {
    constructor(blockLen, outputLen, padOffset, isLE) {
        super();
        this.blockLen = blockLen;
        this.outputLen = outputLen;
        this.padOffset = padOffset;
        this.isLE = isLE;
        this.finished = false;
        this.length = 0;
        this.pos = 0;
        this.destroyed = false;
        this.buffer = new Uint8Array(blockLen);
        this.view = (0,_utils_js__WEBPACK_IMPORTED_MODULE_1__.createView)(this.buffer);
    }
    update(data) {
        _assert_js__WEBPACK_IMPORTED_MODULE_0__["default"].exists(this);
        const { view, buffer, blockLen } = this;
        data = (0,_utils_js__WEBPACK_IMPORTED_MODULE_1__.toBytes)(data);
        const len = data.length;
        for (let pos = 0; pos < len;) {
            const take = Math.min(blockLen - this.pos, len - pos);
            // Fast path: we have at least one block in input, cast it to view and process
            if (take === blockLen) {
                const dataView = (0,_utils_js__WEBPACK_IMPORTED_MODULE_1__.createView)(data);
                for (; blockLen <= len - pos; pos += blockLen)
                    this.process(dataView, pos);
                continue;
            }
            buffer.set(data.subarray(pos, pos + take), this.pos);
            this.pos += take;
            pos += take;
            if (this.pos === blockLen) {
                this.process(view, 0);
                this.pos = 0;
            }
        }
        this.length += data.length;
        this.roundClean();
        return this;
    }
    digestInto(out) {
        _assert_js__WEBPACK_IMPORTED_MODULE_0__["default"].exists(this);
        _assert_js__WEBPACK_IMPORTED_MODULE_0__["default"].output(out, this);
        this.finished = true;
        // Padding
        // We can avoid allocation of buffer for padding completely if it
        // was previously not allocated here. But it won't change performance.
        const { buffer, view, blockLen, isLE } = this;
        let { pos } = this;
        // append the bit '1' to the message
        buffer[pos++] = 0b10000000;
        this.buffer.subarray(pos).fill(0);
        // we have less than padOffset left in buffer, so we cannot put length in current block, need process it and pad again
        if (this.padOffset > blockLen - pos) {
            this.process(view, 0);
            pos = 0;
        }
        // Pad until full block byte with zeros
        for (let i = pos; i < blockLen; i++)
            buffer[i] = 0;
        // Note: sha512 requires length to be 128bit integer, but length in JS will overflow before that
        // You need to write around 2 exabytes (u64_max / 8 / (1024**6)) for this to happen.
        // So we just write lowest 64 bits of that value.
        setBigUint64(view, blockLen - 8, BigInt(this.length * 8), isLE);
        this.process(view, 0);
        const oview = (0,_utils_js__WEBPACK_IMPORTED_MODULE_1__.createView)(out);
        this.get().forEach((v, i) => oview.setUint32(4 * i, v, isLE));
    }
    digest() {
        const { buffer, outputLen } = this;
        this.digestInto(buffer);
        const res = buffer.slice(0, outputLen);
        this.destroy();
        return res;
    }
    _cloneInto(to) {
        to || (to = new this.constructor());
        to.set(...this.get());
        const { blockLen, buffer, length, finished, destroyed, pos } = this;
        to.length = length;
        to.pos = pos;
        to.finished = finished;
        to.destroyed = destroyed;
        if (length % blockLen)
            to.buffer.set(buffer);
        return to;
    }
}


/***/ }),

/***/ "./node_modules/@noble/hashes/esm/_u64.js":
/*!************************************************!*\
  !*** ./node_modules/@noble/hashes/esm/_u64.js ***!
  \************************************************/
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "add": () => (/* binding */ add),
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__),
/* harmony export */   "fromBig": () => (/* binding */ fromBig),
/* harmony export */   "split": () => (/* binding */ split),
/* harmony export */   "toBig": () => (/* binding */ toBig)
/* harmony export */ });
const U32_MASK64 = BigInt(2 ** 32 - 1);
const _32n = BigInt(32);
// We are not using BigUint64Array, because they are extremely slow as per 2022
function fromBig(n, le = false) {
    if (le)
        return { h: Number(n & U32_MASK64), l: Number((n >> _32n) & U32_MASK64) };
    return { h: Number((n >> _32n) & U32_MASK64) | 0, l: Number(n & U32_MASK64) | 0 };
}
function split(lst, le = false) {
    let Ah = new Uint32Array(lst.length);
    let Al = new Uint32Array(lst.length);
    for (let i = 0; i < lst.length; i++) {
        const { h, l } = fromBig(lst[i], le);
        [Ah[i], Al[i]] = [h, l];
    }
    return [Ah, Al];
}
const toBig = (h, l) => (BigInt(h >>> 0) << _32n) | BigInt(l >>> 0);
// for Shift in [0, 32)
const shrSH = (h, l, s) => h >>> s;
const shrSL = (h, l, s) => (h << (32 - s)) | (l >>> s);
// Right rotate for Shift in [1, 32)
const rotrSH = (h, l, s) => (h >>> s) | (l << (32 - s));
const rotrSL = (h, l, s) => (h << (32 - s)) | (l >>> s);
// Right rotate for Shift in (32, 64), NOTE: 32 is special case.
const rotrBH = (h, l, s) => (h << (64 - s)) | (l >>> (s - 32));
const rotrBL = (h, l, s) => (h >>> (s - 32)) | (l << (64 - s));
// Right rotate for shift===32 (just swaps l&h)
const rotr32H = (h, l) => l;
const rotr32L = (h, l) => h;
// Left rotate for Shift in [1, 32)
const rotlSH = (h, l, s) => (h << s) | (l >>> (32 - s));
const rotlSL = (h, l, s) => (l << s) | (h >>> (32 - s));
// Left rotate for Shift in (32, 64), NOTE: 32 is special case.
const rotlBH = (h, l, s) => (l << (s - 32)) | (h >>> (64 - s));
const rotlBL = (h, l, s) => (h << (s - 32)) | (l >>> (64 - s));
// JS uses 32-bit signed integers for bitwise operations which means we cannot
// simple take carry out of low bit sum by shift, we need to use division.
// Removing "export" has 5% perf penalty -_-
function add(Ah, Al, Bh, Bl) {
    const l = (Al >>> 0) + (Bl >>> 0);
    return { h: (Ah + Bh + ((l / 2 ** 32) | 0)) | 0, l: l | 0 };
}
// Addition with more than 2 elements
const add3L = (Al, Bl, Cl) => (Al >>> 0) + (Bl >>> 0) + (Cl >>> 0);
const add3H = (low, Ah, Bh, Ch) => (Ah + Bh + Ch + ((low / 2 ** 32) | 0)) | 0;
const add4L = (Al, Bl, Cl, Dl) => (Al >>> 0) + (Bl >>> 0) + (Cl >>> 0) + (Dl >>> 0);
const add4H = (low, Ah, Bh, Ch, Dh) => (Ah + Bh + Ch + Dh + ((low / 2 ** 32) | 0)) | 0;
const add5L = (Al, Bl, Cl, Dl, El) => (Al >>> 0) + (Bl >>> 0) + (Cl >>> 0) + (Dl >>> 0) + (El >>> 0);
const add5H = (low, Ah, Bh, Ch, Dh, Eh) => (Ah + Bh + Ch + Dh + Eh + ((low / 2 ** 32) | 0)) | 0;
// prettier-ignore
const u64 = {
    fromBig, split, toBig,
    shrSH, shrSL,
    rotrSH, rotrSL, rotrBH, rotrBL,
    rotr32H, rotr32L,
    rotlSH, rotlSL, rotlBH, rotlBL,
    add, add3L, add3H, add4L, add4H, add5H, add5L,
};
/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (u64);


/***/ }),

/***/ "./node_modules/@noble/hashes/esm/cryptoBrowser.js":
/*!*********************************************************!*\
  !*** ./node_modules/@noble/hashes/esm/cryptoBrowser.js ***!
  \*********************************************************/
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "crypto": () => (/* binding */ crypto)
/* harmony export */ });
const crypto = {
    node: undefined,
    web: typeof self === 'object' && 'crypto' in self ? self.crypto : undefined,
};


/***/ }),

/***/ "./node_modules/@noble/hashes/esm/hmac.js":
/*!************************************************!*\
  !*** ./node_modules/@noble/hashes/esm/hmac.js ***!
  \************************************************/
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "hmac": () => (/* binding */ hmac)
/* harmony export */ });
/* harmony import */ var _assert_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./_assert.js */ "./node_modules/@noble/hashes/esm/_assert.js");
/* harmony import */ var _utils_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./utils.js */ "./node_modules/@noble/hashes/esm/utils.js");


// HMAC (RFC 2104)
class HMAC extends _utils_js__WEBPACK_IMPORTED_MODULE_1__.Hash {
    constructor(hash, _key) {
        super();
        this.finished = false;
        this.destroyed = false;
        _assert_js__WEBPACK_IMPORTED_MODULE_0__["default"].hash(hash);
        const key = (0,_utils_js__WEBPACK_IMPORTED_MODULE_1__.toBytes)(_key);
        this.iHash = hash.create();
        if (!(this.iHash instanceof _utils_js__WEBPACK_IMPORTED_MODULE_1__.Hash))
            throw new TypeError('Expected instance of class which extends utils.Hash');
        const blockLen = (this.blockLen = this.iHash.blockLen);
        this.outputLen = this.iHash.outputLen;
        const pad = new Uint8Array(blockLen);
        // blockLen can be bigger than outputLen
        pad.set(key.length > this.iHash.blockLen ? hash.create().update(key).digest() : key);
        for (let i = 0; i < pad.length; i++)
            pad[i] ^= 0x36;
        this.iHash.update(pad);
        // By doing update (processing of first block) of outer hash here we can re-use it between multiple calls via clone
        this.oHash = hash.create();
        // Undo internal XOR && apply outer XOR
        for (let i = 0; i < pad.length; i++)
            pad[i] ^= 0x36 ^ 0x5c;
        this.oHash.update(pad);
        pad.fill(0);
    }
    update(buf) {
        _assert_js__WEBPACK_IMPORTED_MODULE_0__["default"].exists(this);
        this.iHash.update(buf);
        return this;
    }
    digestInto(out) {
        _assert_js__WEBPACK_IMPORTED_MODULE_0__["default"].exists(this);
        _assert_js__WEBPACK_IMPORTED_MODULE_0__["default"].bytes(out, this.outputLen);
        this.finished = true;
        this.iHash.digestInto(out);
        this.oHash.update(out);
        this.oHash.digestInto(out);
        this.destroy();
    }
    digest() {
        const out = new Uint8Array(this.oHash.outputLen);
        this.digestInto(out);
        return out;
    }
    _cloneInto(to) {
        // Create new instance without calling constructor since key already in state and we don't know it.
        to || (to = Object.create(Object.getPrototypeOf(this), {}));
        const { oHash, iHash, finished, destroyed, blockLen, outputLen } = this;
        to = to;
        to.finished = finished;
        to.destroyed = destroyed;
        to.blockLen = blockLen;
        to.outputLen = outputLen;
        to.oHash = oHash._cloneInto(to.oHash);
        to.iHash = iHash._cloneInto(to.iHash);
        return to;
    }
    destroy() {
        this.destroyed = true;
        this.oHash.destroy();
        this.iHash.destroy();
    }
}
/**
 * HMAC: RFC2104 message authentication code.
 * @param hash - function that would be used e.g. sha256
 * @param key - message key
 * @param message - message data
 */
const hmac = (hash, key, message) => new HMAC(hash, key).update(message).digest();
hmac.create = (hash, key) => new HMAC(hash, key);


/***/ }),

/***/ "./node_modules/@noble/hashes/esm/pbkdf2.js":
/*!**************************************************!*\
  !*** ./node_modules/@noble/hashes/esm/pbkdf2.js ***!
  \**************************************************/
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "pbkdf2": () => (/* binding */ pbkdf2),
/* harmony export */   "pbkdf2Async": () => (/* binding */ pbkdf2Async)
/* harmony export */ });
/* harmony import */ var _assert_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./_assert.js */ "./node_modules/@noble/hashes/esm/_assert.js");
/* harmony import */ var _hmac_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./hmac.js */ "./node_modules/@noble/hashes/esm/hmac.js");
/* harmony import */ var _utils_js__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./utils.js */ "./node_modules/@noble/hashes/esm/utils.js");



// Common prologue and epilogue for sync/async functions
function pbkdf2Init(hash, _password, _salt, _opts) {
    _assert_js__WEBPACK_IMPORTED_MODULE_0__["default"].hash(hash);
    const opts = (0,_utils_js__WEBPACK_IMPORTED_MODULE_2__.checkOpts)({ dkLen: 32, asyncTick: 10 }, _opts);
    const { c, dkLen, asyncTick } = opts;
    _assert_js__WEBPACK_IMPORTED_MODULE_0__["default"].number(c);
    _assert_js__WEBPACK_IMPORTED_MODULE_0__["default"].number(dkLen);
    _assert_js__WEBPACK_IMPORTED_MODULE_0__["default"].number(asyncTick);
    if (c < 1)
        throw new Error('PBKDF2: iterations (c) should be >= 1');
    const password = (0,_utils_js__WEBPACK_IMPORTED_MODULE_2__.toBytes)(_password);
    const salt = (0,_utils_js__WEBPACK_IMPORTED_MODULE_2__.toBytes)(_salt);
    // DK = PBKDF2(PRF, Password, Salt, c, dkLen);
    const DK = new Uint8Array(dkLen);
    // U1 = PRF(Password, Salt + INT_32_BE(i))
    const PRF = _hmac_js__WEBPACK_IMPORTED_MODULE_1__.hmac.create(hash, password);
    const PRFSalt = PRF._cloneInto().update(salt);
    return { c, dkLen, asyncTick, DK, PRF, PRFSalt };
}
function pbkdf2Output(PRF, PRFSalt, DK, prfW, u) {
    PRF.destroy();
    PRFSalt.destroy();
    if (prfW)
        prfW.destroy();
    u.fill(0);
    return DK;
}
/**
 * PBKDF2-HMAC: RFC 2898 key derivation function
 * @param hash - hash function that would be used e.g. sha256
 * @param password - password from which a derived key is generated
 * @param salt - cryptographic salt
 * @param opts - {c, dkLen} where c is work factor and dkLen is output message size
 */
function pbkdf2(hash, password, salt, opts) {
    const { c, dkLen, DK, PRF, PRFSalt } = pbkdf2Init(hash, password, salt, opts);
    let prfW; // Working copy
    const arr = new Uint8Array(4);
    const view = (0,_utils_js__WEBPACK_IMPORTED_MODULE_2__.createView)(arr);
    const u = new Uint8Array(PRF.outputLen);
    // DK = T1 + T2 + ⋯ + Tdklen/hlen
    for (let ti = 1, pos = 0; pos < dkLen; ti++, pos += PRF.outputLen) {
        // Ti = F(Password, Salt, c, i)
        const Ti = DK.subarray(pos, pos + PRF.outputLen);
        view.setInt32(0, ti, false);
        // F(Password, Salt, c, i) = U1 ^ U2 ^ ⋯ ^ Uc
        // U1 = PRF(Password, Salt + INT_32_BE(i))
        (prfW = PRFSalt._cloneInto(prfW)).update(arr).digestInto(u);
        Ti.set(u.subarray(0, Ti.length));
        for (let ui = 1; ui < c; ui++) {
            // Uc = PRF(Password, Uc−1)
            PRF._cloneInto(prfW).update(u).digestInto(u);
            for (let i = 0; i < Ti.length; i++)
                Ti[i] ^= u[i];
        }
    }
    return pbkdf2Output(PRF, PRFSalt, DK, prfW, u);
}
async function pbkdf2Async(hash, password, salt, opts) {
    const { c, dkLen, asyncTick, DK, PRF, PRFSalt } = pbkdf2Init(hash, password, salt, opts);
    let prfW; // Working copy
    const arr = new Uint8Array(4);
    const view = (0,_utils_js__WEBPACK_IMPORTED_MODULE_2__.createView)(arr);
    const u = new Uint8Array(PRF.outputLen);
    // DK = T1 + T2 + ⋯ + Tdklen/hlen
    for (let ti = 1, pos = 0; pos < dkLen; ti++, pos += PRF.outputLen) {
        // Ti = F(Password, Salt, c, i)
        const Ti = DK.subarray(pos, pos + PRF.outputLen);
        view.setInt32(0, ti, false);
        // F(Password, Salt, c, i) = U1 ^ U2 ^ ⋯ ^ Uc
        // U1 = PRF(Password, Salt + INT_32_BE(i))
        (prfW = PRFSalt._cloneInto(prfW)).update(arr).digestInto(u);
        Ti.set(u.subarray(0, Ti.length));
        await (0,_utils_js__WEBPACK_IMPORTED_MODULE_2__.asyncLoop)(c - 1, asyncTick, (i) => {
            // Uc = PRF(Password, Uc−1)
            PRF._cloneInto(prfW).update(u).digestInto(u);
            for (let i = 0; i < Ti.length; i++)
                Ti[i] ^= u[i];
        });
    }
    return pbkdf2Output(PRF, PRFSalt, DK, prfW, u);
}


/***/ }),

/***/ "./node_modules/@noble/hashes/esm/sha256.js":
/*!**************************************************!*\
  !*** ./node_modules/@noble/hashes/esm/sha256.js ***!
  \**************************************************/
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "sha256": () => (/* binding */ sha256)
/* harmony export */ });
/* harmony import */ var _sha2_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./_sha2.js */ "./node_modules/@noble/hashes/esm/_sha2.js");
/* harmony import */ var _utils_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./utils.js */ "./node_modules/@noble/hashes/esm/utils.js");


// Choice: a ? b : c
const Chi = (a, b, c) => (a & b) ^ (~a & c);
// Majority function, true if any two inpust is true
const Maj = (a, b, c) => (a & b) ^ (a & c) ^ (b & c);
// Round constants:
// first 32 bits of the fractional parts of the cube roots of the first 64 primes 2..311)
// prettier-ignore
const SHA256_K = new Uint32Array([
    0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
    0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
    0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
    0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
    0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
    0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
    0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
    0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2
]);
// Initial state (first 32 bits of the fractional parts of the square roots of the first 8 primes 2..19):
// prettier-ignore
const IV = new Uint32Array([
    0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a, 0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19
]);
// Temporary buffer, not used to store anything between runs
// Named this way because it matches specification.
const SHA256_W = new Uint32Array(64);
class SHA256 extends _sha2_js__WEBPACK_IMPORTED_MODULE_0__.SHA2 {
    constructor() {
        super(64, 32, 8, false);
        // We cannot use array here since array allows indexing by variable
        // which means optimizer/compiler cannot use registers.
        this.A = IV[0] | 0;
        this.B = IV[1] | 0;
        this.C = IV[2] | 0;
        this.D = IV[3] | 0;
        this.E = IV[4] | 0;
        this.F = IV[5] | 0;
        this.G = IV[6] | 0;
        this.H = IV[7] | 0;
    }
    get() {
        const { A, B, C, D, E, F, G, H } = this;
        return [A, B, C, D, E, F, G, H];
    }
    // prettier-ignore
    set(A, B, C, D, E, F, G, H) {
        this.A = A | 0;
        this.B = B | 0;
        this.C = C | 0;
        this.D = D | 0;
        this.E = E | 0;
        this.F = F | 0;
        this.G = G | 0;
        this.H = H | 0;
    }
    process(view, offset) {
        // Extend the first 16 words into the remaining 48 words w[16..63] of the message schedule array
        for (let i = 0; i < 16; i++, offset += 4)
            SHA256_W[i] = view.getUint32(offset, false);
        for (let i = 16; i < 64; i++) {
            const W15 = SHA256_W[i - 15];
            const W2 = SHA256_W[i - 2];
            const s0 = (0,_utils_js__WEBPACK_IMPORTED_MODULE_1__.rotr)(W15, 7) ^ (0,_utils_js__WEBPACK_IMPORTED_MODULE_1__.rotr)(W15, 18) ^ (W15 >>> 3);
            const s1 = (0,_utils_js__WEBPACK_IMPORTED_MODULE_1__.rotr)(W2, 17) ^ (0,_utils_js__WEBPACK_IMPORTED_MODULE_1__.rotr)(W2, 19) ^ (W2 >>> 10);
            SHA256_W[i] = (s1 + SHA256_W[i - 7] + s0 + SHA256_W[i - 16]) | 0;
        }
        // Compression function main loop, 64 rounds
        let { A, B, C, D, E, F, G, H } = this;
        for (let i = 0; i < 64; i++) {
            const sigma1 = (0,_utils_js__WEBPACK_IMPORTED_MODULE_1__.rotr)(E, 6) ^ (0,_utils_js__WEBPACK_IMPORTED_MODULE_1__.rotr)(E, 11) ^ (0,_utils_js__WEBPACK_IMPORTED_MODULE_1__.rotr)(E, 25);
            const T1 = (H + sigma1 + Chi(E, F, G) + SHA256_K[i] + SHA256_W[i]) | 0;
            const sigma0 = (0,_utils_js__WEBPACK_IMPORTED_MODULE_1__.rotr)(A, 2) ^ (0,_utils_js__WEBPACK_IMPORTED_MODULE_1__.rotr)(A, 13) ^ (0,_utils_js__WEBPACK_IMPORTED_MODULE_1__.rotr)(A, 22);
            const T2 = (sigma0 + Maj(A, B, C)) | 0;
            H = G;
            G = F;
            F = E;
            E = (D + T1) | 0;
            D = C;
            C = B;
            B = A;
            A = (T1 + T2) | 0;
        }
        // Add the compressed chunk to the current hash value
        A = (A + this.A) | 0;
        B = (B + this.B) | 0;
        C = (C + this.C) | 0;
        D = (D + this.D) | 0;
        E = (E + this.E) | 0;
        F = (F + this.F) | 0;
        G = (G + this.G) | 0;
        H = (H + this.H) | 0;
        this.set(A, B, C, D, E, F, G, H);
    }
    roundClean() {
        SHA256_W.fill(0);
    }
    destroy() {
        this.set(0, 0, 0, 0, 0, 0, 0, 0);
        this.buffer.fill(0);
    }
}
/**
 * SHA2-256 hash function
 * @param message - data that would be hashed
 */
const sha256 = (0,_utils_js__WEBPACK_IMPORTED_MODULE_1__.wrapConstructor)(() => new SHA256());


/***/ }),

/***/ "./node_modules/@noble/hashes/esm/sha3.js":
/*!************************************************!*\
  !*** ./node_modules/@noble/hashes/esm/sha3.js ***!
  \************************************************/
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "Keccak": () => (/* binding */ Keccak),
/* harmony export */   "keccakP": () => (/* binding */ keccakP),
/* harmony export */   "keccak_224": () => (/* binding */ keccak_224),
/* harmony export */   "keccak_256": () => (/* binding */ keccak_256),
/* harmony export */   "keccak_384": () => (/* binding */ keccak_384),
/* harmony export */   "keccak_512": () => (/* binding */ keccak_512),
/* harmony export */   "sha3_224": () => (/* binding */ sha3_224),
/* harmony export */   "sha3_256": () => (/* binding */ sha3_256),
/* harmony export */   "sha3_384": () => (/* binding */ sha3_384),
/* harmony export */   "sha3_512": () => (/* binding */ sha3_512),
/* harmony export */   "shake128": () => (/* binding */ shake128),
/* harmony export */   "shake256": () => (/* binding */ shake256)
/* harmony export */ });
/* harmony import */ var _assert_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./_assert.js */ "./node_modules/@noble/hashes/esm/_assert.js");
/* harmony import */ var _u64_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./_u64.js */ "./node_modules/@noble/hashes/esm/_u64.js");
/* harmony import */ var _utils_js__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./utils.js */ "./node_modules/@noble/hashes/esm/utils.js");



// Various per round constants calculations
const [SHA3_PI, SHA3_ROTL, _SHA3_IOTA] = [[], [], []];
const _0n = BigInt(0);
const _1n = BigInt(1);
const _2n = BigInt(2);
const _7n = BigInt(7);
const _256n = BigInt(256);
const _0x71n = BigInt(0x71);
for (let round = 0, R = _1n, x = 1, y = 0; round < 24; round++) {
    // Pi
    [x, y] = [y, (2 * x + 3 * y) % 5];
    SHA3_PI.push(2 * (5 * y + x));
    // Rotational
    SHA3_ROTL.push((((round + 1) * (round + 2)) / 2) % 64);
    // Iota
    let t = _0n;
    for (let j = 0; j < 7; j++) {
        R = ((R << _1n) ^ ((R >> _7n) * _0x71n)) % _256n;
        if (R & _2n)
            t ^= _1n << ((_1n << BigInt(j)) - _1n);
    }
    _SHA3_IOTA.push(t);
}
const [SHA3_IOTA_H, SHA3_IOTA_L] = _u64_js__WEBPACK_IMPORTED_MODULE_1__["default"].split(_SHA3_IOTA, true);
// Left rotation (without 0, 32, 64)
const rotlH = (h, l, s) => s > 32 ? _u64_js__WEBPACK_IMPORTED_MODULE_1__["default"].rotlBH(h, l, s) : _u64_js__WEBPACK_IMPORTED_MODULE_1__["default"].rotlSH(h, l, s);
const rotlL = (h, l, s) => s > 32 ? _u64_js__WEBPACK_IMPORTED_MODULE_1__["default"].rotlBL(h, l, s) : _u64_js__WEBPACK_IMPORTED_MODULE_1__["default"].rotlSL(h, l, s);
// Same as keccakf1600, but allows to skip some rounds
function keccakP(s, rounds = 24) {
    const B = new Uint32Array(5 * 2);
    // NOTE: all indices are x2 since we store state as u32 instead of u64 (bigints to slow in js)
    for (let round = 24 - rounds; round < 24; round++) {
        // Theta θ
        for (let x = 0; x < 10; x++)
            B[x] = s[x] ^ s[x + 10] ^ s[x + 20] ^ s[x + 30] ^ s[x + 40];
        for (let x = 0; x < 10; x += 2) {
            const idx1 = (x + 8) % 10;
            const idx0 = (x + 2) % 10;
            const B0 = B[idx0];
            const B1 = B[idx0 + 1];
            const Th = rotlH(B0, B1, 1) ^ B[idx1];
            const Tl = rotlL(B0, B1, 1) ^ B[idx1 + 1];
            for (let y = 0; y < 50; y += 10) {
                s[x + y] ^= Th;
                s[x + y + 1] ^= Tl;
            }
        }
        // Rho (ρ) and Pi (π)
        let curH = s[2];
        let curL = s[3];
        for (let t = 0; t < 24; t++) {
            const shift = SHA3_ROTL[t];
            const Th = rotlH(curH, curL, shift);
            const Tl = rotlL(curH, curL, shift);
            const PI = SHA3_PI[t];
            curH = s[PI];
            curL = s[PI + 1];
            s[PI] = Th;
            s[PI + 1] = Tl;
        }
        // Chi (χ)
        for (let y = 0; y < 50; y += 10) {
            for (let x = 0; x < 10; x++)
                B[x] = s[y + x];
            for (let x = 0; x < 10; x++)
                s[y + x] ^= ~B[(x + 2) % 10] & B[(x + 4) % 10];
        }
        // Iota (ι)
        s[0] ^= SHA3_IOTA_H[round];
        s[1] ^= SHA3_IOTA_L[round];
    }
    B.fill(0);
}
class Keccak extends _utils_js__WEBPACK_IMPORTED_MODULE_2__.Hash {
    // NOTE: we accept arguments in bytes instead of bits here.
    constructor(blockLen, suffix, outputLen, enableXOF = false, rounds = 24) {
        super();
        this.blockLen = blockLen;
        this.suffix = suffix;
        this.outputLen = outputLen;
        this.enableXOF = enableXOF;
        this.rounds = rounds;
        this.pos = 0;
        this.posOut = 0;
        this.finished = false;
        this.destroyed = false;
        // Can be passed from user as dkLen
        _assert_js__WEBPACK_IMPORTED_MODULE_0__["default"].number(outputLen);
        // 1600 = 5x5 matrix of 64bit.  1600 bits === 200 bytes
        if (0 >= this.blockLen || this.blockLen >= 200)
            throw new Error('Sha3 supports only keccak-f1600 function');
        this.state = new Uint8Array(200);
        this.state32 = (0,_utils_js__WEBPACK_IMPORTED_MODULE_2__.u32)(this.state);
    }
    keccak() {
        keccakP(this.state32, this.rounds);
        this.posOut = 0;
        this.pos = 0;
    }
    update(data) {
        _assert_js__WEBPACK_IMPORTED_MODULE_0__["default"].exists(this);
        const { blockLen, state } = this;
        data = (0,_utils_js__WEBPACK_IMPORTED_MODULE_2__.toBytes)(data);
        const len = data.length;
        for (let pos = 0; pos < len;) {
            const take = Math.min(blockLen - this.pos, len - pos);
            for (let i = 0; i < take; i++)
                state[this.pos++] ^= data[pos++];
            if (this.pos === blockLen)
                this.keccak();
        }
        return this;
    }
    finish() {
        if (this.finished)
            return;
        this.finished = true;
        const { state, suffix, pos, blockLen } = this;
        // Do the padding
        state[pos] ^= suffix;
        if ((suffix & 0x80) !== 0 && pos === blockLen - 1)
            this.keccak();
        state[blockLen - 1] ^= 0x80;
        this.keccak();
    }
    writeInto(out) {
        _assert_js__WEBPACK_IMPORTED_MODULE_0__["default"].exists(this, false);
        _assert_js__WEBPACK_IMPORTED_MODULE_0__["default"].bytes(out);
        this.finish();
        const bufferOut = this.state;
        const { blockLen } = this;
        for (let pos = 0, len = out.length; pos < len;) {
            if (this.posOut >= blockLen)
                this.keccak();
            const take = Math.min(blockLen - this.posOut, len - pos);
            out.set(bufferOut.subarray(this.posOut, this.posOut + take), pos);
            this.posOut += take;
            pos += take;
        }
        return out;
    }
    xofInto(out) {
        // Sha3/Keccak usage with XOF is probably mistake, only SHAKE instances can do XOF
        if (!this.enableXOF)
            throw new Error('XOF is not possible for this instance');
        return this.writeInto(out);
    }
    xof(bytes) {
        _assert_js__WEBPACK_IMPORTED_MODULE_0__["default"].number(bytes);
        return this.xofInto(new Uint8Array(bytes));
    }
    digestInto(out) {
        _assert_js__WEBPACK_IMPORTED_MODULE_0__["default"].output(out, this);
        if (this.finished)
            throw new Error('digest() was already called');
        this.writeInto(out);
        this.destroy();
        return out;
    }
    digest() {
        return this.digestInto(new Uint8Array(this.outputLen));
    }
    destroy() {
        this.destroyed = true;
        this.state.fill(0);
    }
    _cloneInto(to) {
        const { blockLen, suffix, outputLen, rounds, enableXOF } = this;
        to || (to = new Keccak(blockLen, suffix, outputLen, enableXOF, rounds));
        to.state32.set(this.state32);
        to.pos = this.pos;
        to.posOut = this.posOut;
        to.finished = this.finished;
        to.rounds = rounds;
        // Suffix can change in cSHAKE
        to.suffix = suffix;
        to.outputLen = outputLen;
        to.enableXOF = enableXOF;
        to.destroyed = this.destroyed;
        return to;
    }
}
const gen = (suffix, blockLen, outputLen) => (0,_utils_js__WEBPACK_IMPORTED_MODULE_2__.wrapConstructor)(() => new Keccak(blockLen, suffix, outputLen));
const sha3_224 = gen(0x06, 144, 224 / 8);
/**
 * SHA3-256 hash function
 * @param message - that would be hashed
 */
const sha3_256 = gen(0x06, 136, 256 / 8);
const sha3_384 = gen(0x06, 104, 384 / 8);
const sha3_512 = gen(0x06, 72, 512 / 8);
const keccak_224 = gen(0x01, 144, 224 / 8);
/**
 * keccak-256 hash function. Different from SHA3-256.
 * @param message - that would be hashed
 */
const keccak_256 = gen(0x01, 136, 256 / 8);
const keccak_384 = gen(0x01, 104, 384 / 8);
const keccak_512 = gen(0x01, 72, 512 / 8);
const genShake = (suffix, blockLen, outputLen) => (0,_utils_js__WEBPACK_IMPORTED_MODULE_2__.wrapConstructorWithOpts)((opts = {}) => new Keccak(blockLen, suffix, opts.dkLen === undefined ? outputLen : opts.dkLen, true));
const shake128 = genShake(0x1f, 168, 128 / 8);
const shake256 = genShake(0x1f, 136, 256 / 8);


/***/ }),

/***/ "./node_modules/@noble/hashes/esm/sha512.js":
/*!**************************************************!*\
  !*** ./node_modules/@noble/hashes/esm/sha512.js ***!
  \**************************************************/
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "SHA512": () => (/* binding */ SHA512),
/* harmony export */   "sha384": () => (/* binding */ sha384),
/* harmony export */   "sha512": () => (/* binding */ sha512),
/* harmony export */   "sha512_256": () => (/* binding */ sha512_256)
/* harmony export */ });
/* harmony import */ var _sha2_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./_sha2.js */ "./node_modules/@noble/hashes/esm/_sha2.js");
/* harmony import */ var _u64_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./_u64.js */ "./node_modules/@noble/hashes/esm/_u64.js");
/* harmony import */ var _utils_js__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./utils.js */ "./node_modules/@noble/hashes/esm/utils.js");



// Round contants (first 32 bits of the fractional parts of the cube roots of the first 80 primes 2..409):
// prettier-ignore
const [SHA512_Kh, SHA512_Kl] = _u64_js__WEBPACK_IMPORTED_MODULE_1__["default"].split([
    '0x428a2f98d728ae22', '0x7137449123ef65cd', '0xb5c0fbcfec4d3b2f', '0xe9b5dba58189dbbc',
    '0x3956c25bf348b538', '0x59f111f1b605d019', '0x923f82a4af194f9b', '0xab1c5ed5da6d8118',
    '0xd807aa98a3030242', '0x12835b0145706fbe', '0x243185be4ee4b28c', '0x550c7dc3d5ffb4e2',
    '0x72be5d74f27b896f', '0x80deb1fe3b1696b1', '0x9bdc06a725c71235', '0xc19bf174cf692694',
    '0xe49b69c19ef14ad2', '0xefbe4786384f25e3', '0x0fc19dc68b8cd5b5', '0x240ca1cc77ac9c65',
    '0x2de92c6f592b0275', '0x4a7484aa6ea6e483', '0x5cb0a9dcbd41fbd4', '0x76f988da831153b5',
    '0x983e5152ee66dfab', '0xa831c66d2db43210', '0xb00327c898fb213f', '0xbf597fc7beef0ee4',
    '0xc6e00bf33da88fc2', '0xd5a79147930aa725', '0x06ca6351e003826f', '0x142929670a0e6e70',
    '0x27b70a8546d22ffc', '0x2e1b21385c26c926', '0x4d2c6dfc5ac42aed', '0x53380d139d95b3df',
    '0x650a73548baf63de', '0x766a0abb3c77b2a8', '0x81c2c92e47edaee6', '0x92722c851482353b',
    '0xa2bfe8a14cf10364', '0xa81a664bbc423001', '0xc24b8b70d0f89791', '0xc76c51a30654be30',
    '0xd192e819d6ef5218', '0xd69906245565a910', '0xf40e35855771202a', '0x106aa07032bbd1b8',
    '0x19a4c116b8d2d0c8', '0x1e376c085141ab53', '0x2748774cdf8eeb99', '0x34b0bcb5e19b48a8',
    '0x391c0cb3c5c95a63', '0x4ed8aa4ae3418acb', '0x5b9cca4f7763e373', '0x682e6ff3d6b2b8a3',
    '0x748f82ee5defb2fc', '0x78a5636f43172f60', '0x84c87814a1f0ab72', '0x8cc702081a6439ec',
    '0x90befffa23631e28', '0xa4506cebde82bde9', '0xbef9a3f7b2c67915', '0xc67178f2e372532b',
    '0xca273eceea26619c', '0xd186b8c721c0c207', '0xeada7dd6cde0eb1e', '0xf57d4f7fee6ed178',
    '0x06f067aa72176fba', '0x0a637dc5a2c898a6', '0x113f9804bef90dae', '0x1b710b35131c471b',
    '0x28db77f523047d84', '0x32caab7b40c72493', '0x3c9ebe0a15c9bebc', '0x431d67c49c100d4c',
    '0x4cc5d4becb3e42b6', '0x597f299cfc657e2a', '0x5fcb6fab3ad6faec', '0x6c44198c4a475817'
].map(n => BigInt(n)));
// Temporary buffer, not used to store anything between runs
const SHA512_W_H = new Uint32Array(80);
const SHA512_W_L = new Uint32Array(80);
class SHA512 extends _sha2_js__WEBPACK_IMPORTED_MODULE_0__.SHA2 {
    constructor() {
        super(128, 64, 16, false);
        // We cannot use array here since array allows indexing by variable which means optimizer/compiler cannot use registers.
        // Also looks cleaner and easier to verify with spec.
        // Initial state (first 32 bits of the fractional parts of the square roots of the first 8 primes 2..19):
        // h -- high 32 bits, l -- low 32 bits
        this.Ah = 0x6a09e667 | 0;
        this.Al = 0xf3bcc908 | 0;
        this.Bh = 0xbb67ae85 | 0;
        this.Bl = 0x84caa73b | 0;
        this.Ch = 0x3c6ef372 | 0;
        this.Cl = 0xfe94f82b | 0;
        this.Dh = 0xa54ff53a | 0;
        this.Dl = 0x5f1d36f1 | 0;
        this.Eh = 0x510e527f | 0;
        this.El = 0xade682d1 | 0;
        this.Fh = 0x9b05688c | 0;
        this.Fl = 0x2b3e6c1f | 0;
        this.Gh = 0x1f83d9ab | 0;
        this.Gl = 0xfb41bd6b | 0;
        this.Hh = 0x5be0cd19 | 0;
        this.Hl = 0x137e2179 | 0;
    }
    // prettier-ignore
    get() {
        const { Ah, Al, Bh, Bl, Ch, Cl, Dh, Dl, Eh, El, Fh, Fl, Gh, Gl, Hh, Hl } = this;
        return [Ah, Al, Bh, Bl, Ch, Cl, Dh, Dl, Eh, El, Fh, Fl, Gh, Gl, Hh, Hl];
    }
    // prettier-ignore
    set(Ah, Al, Bh, Bl, Ch, Cl, Dh, Dl, Eh, El, Fh, Fl, Gh, Gl, Hh, Hl) {
        this.Ah = Ah | 0;
        this.Al = Al | 0;
        this.Bh = Bh | 0;
        this.Bl = Bl | 0;
        this.Ch = Ch | 0;
        this.Cl = Cl | 0;
        this.Dh = Dh | 0;
        this.Dl = Dl | 0;
        this.Eh = Eh | 0;
        this.El = El | 0;
        this.Fh = Fh | 0;
        this.Fl = Fl | 0;
        this.Gh = Gh | 0;
        this.Gl = Gl | 0;
        this.Hh = Hh | 0;
        this.Hl = Hl | 0;
    }
    process(view, offset) {
        // Extend the first 16 words into the remaining 64 words w[16..79] of the message schedule array
        for (let i = 0; i < 16; i++, offset += 4) {
            SHA512_W_H[i] = view.getUint32(offset);
            SHA512_W_L[i] = view.getUint32((offset += 4));
        }
        for (let i = 16; i < 80; i++) {
            // s0 := (w[i-15] rightrotate 1) xor (w[i-15] rightrotate 8) xor (w[i-15] rightshift 7)
            const W15h = SHA512_W_H[i - 15] | 0;
            const W15l = SHA512_W_L[i - 15] | 0;
            const s0h = _u64_js__WEBPACK_IMPORTED_MODULE_1__["default"].rotrSH(W15h, W15l, 1) ^ _u64_js__WEBPACK_IMPORTED_MODULE_1__["default"].rotrSH(W15h, W15l, 8) ^ _u64_js__WEBPACK_IMPORTED_MODULE_1__["default"].shrSH(W15h, W15l, 7);
            const s0l = _u64_js__WEBPACK_IMPORTED_MODULE_1__["default"].rotrSL(W15h, W15l, 1) ^ _u64_js__WEBPACK_IMPORTED_MODULE_1__["default"].rotrSL(W15h, W15l, 8) ^ _u64_js__WEBPACK_IMPORTED_MODULE_1__["default"].shrSL(W15h, W15l, 7);
            // s1 := (w[i-2] rightrotate 19) xor (w[i-2] rightrotate 61) xor (w[i-2] rightshift 6)
            const W2h = SHA512_W_H[i - 2] | 0;
            const W2l = SHA512_W_L[i - 2] | 0;
            const s1h = _u64_js__WEBPACK_IMPORTED_MODULE_1__["default"].rotrSH(W2h, W2l, 19) ^ _u64_js__WEBPACK_IMPORTED_MODULE_1__["default"].rotrBH(W2h, W2l, 61) ^ _u64_js__WEBPACK_IMPORTED_MODULE_1__["default"].shrSH(W2h, W2l, 6);
            const s1l = _u64_js__WEBPACK_IMPORTED_MODULE_1__["default"].rotrSL(W2h, W2l, 19) ^ _u64_js__WEBPACK_IMPORTED_MODULE_1__["default"].rotrBL(W2h, W2l, 61) ^ _u64_js__WEBPACK_IMPORTED_MODULE_1__["default"].shrSL(W2h, W2l, 6);
            // SHA256_W[i] = s0 + s1 + SHA256_W[i - 7] + SHA256_W[i - 16];
            const SUMl = _u64_js__WEBPACK_IMPORTED_MODULE_1__["default"].add4L(s0l, s1l, SHA512_W_L[i - 7], SHA512_W_L[i - 16]);
            const SUMh = _u64_js__WEBPACK_IMPORTED_MODULE_1__["default"].add4H(SUMl, s0h, s1h, SHA512_W_H[i - 7], SHA512_W_H[i - 16]);
            SHA512_W_H[i] = SUMh | 0;
            SHA512_W_L[i] = SUMl | 0;
        }
        let { Ah, Al, Bh, Bl, Ch, Cl, Dh, Dl, Eh, El, Fh, Fl, Gh, Gl, Hh, Hl } = this;
        // Compression function main loop, 80 rounds
        for (let i = 0; i < 80; i++) {
            // S1 := (e rightrotate 14) xor (e rightrotate 18) xor (e rightrotate 41)
            const sigma1h = _u64_js__WEBPACK_IMPORTED_MODULE_1__["default"].rotrSH(Eh, El, 14) ^ _u64_js__WEBPACK_IMPORTED_MODULE_1__["default"].rotrSH(Eh, El, 18) ^ _u64_js__WEBPACK_IMPORTED_MODULE_1__["default"].rotrBH(Eh, El, 41);
            const sigma1l = _u64_js__WEBPACK_IMPORTED_MODULE_1__["default"].rotrSL(Eh, El, 14) ^ _u64_js__WEBPACK_IMPORTED_MODULE_1__["default"].rotrSL(Eh, El, 18) ^ _u64_js__WEBPACK_IMPORTED_MODULE_1__["default"].rotrBL(Eh, El, 41);
            //const T1 = (H + sigma1 + Chi(E, F, G) + SHA256_K[i] + SHA256_W[i]) | 0;
            const CHIh = (Eh & Fh) ^ (~Eh & Gh);
            const CHIl = (El & Fl) ^ (~El & Gl);
            // T1 = H + sigma1 + Chi(E, F, G) + SHA512_K[i] + SHA512_W[i]
            // prettier-ignore
            const T1ll = _u64_js__WEBPACK_IMPORTED_MODULE_1__["default"].add5L(Hl, sigma1l, CHIl, SHA512_Kl[i], SHA512_W_L[i]);
            const T1h = _u64_js__WEBPACK_IMPORTED_MODULE_1__["default"].add5H(T1ll, Hh, sigma1h, CHIh, SHA512_Kh[i], SHA512_W_H[i]);
            const T1l = T1ll | 0;
            // S0 := (a rightrotate 28) xor (a rightrotate 34) xor (a rightrotate 39)
            const sigma0h = _u64_js__WEBPACK_IMPORTED_MODULE_1__["default"].rotrSH(Ah, Al, 28) ^ _u64_js__WEBPACK_IMPORTED_MODULE_1__["default"].rotrBH(Ah, Al, 34) ^ _u64_js__WEBPACK_IMPORTED_MODULE_1__["default"].rotrBH(Ah, Al, 39);
            const sigma0l = _u64_js__WEBPACK_IMPORTED_MODULE_1__["default"].rotrSL(Ah, Al, 28) ^ _u64_js__WEBPACK_IMPORTED_MODULE_1__["default"].rotrBL(Ah, Al, 34) ^ _u64_js__WEBPACK_IMPORTED_MODULE_1__["default"].rotrBL(Ah, Al, 39);
            const MAJh = (Ah & Bh) ^ (Ah & Ch) ^ (Bh & Ch);
            const MAJl = (Al & Bl) ^ (Al & Cl) ^ (Bl & Cl);
            Hh = Gh | 0;
            Hl = Gl | 0;
            Gh = Fh | 0;
            Gl = Fl | 0;
            Fh = Eh | 0;
            Fl = El | 0;
            ({ h: Eh, l: El } = _u64_js__WEBPACK_IMPORTED_MODULE_1__["default"].add(Dh | 0, Dl | 0, T1h | 0, T1l | 0));
            Dh = Ch | 0;
            Dl = Cl | 0;
            Ch = Bh | 0;
            Cl = Bl | 0;
            Bh = Ah | 0;
            Bl = Al | 0;
            const All = _u64_js__WEBPACK_IMPORTED_MODULE_1__["default"].add3L(T1l, sigma0l, MAJl);
            Ah = _u64_js__WEBPACK_IMPORTED_MODULE_1__["default"].add3H(All, T1h, sigma0h, MAJh);
            Al = All | 0;
        }
        // Add the compressed chunk to the current hash value
        ({ h: Ah, l: Al } = _u64_js__WEBPACK_IMPORTED_MODULE_1__["default"].add(this.Ah | 0, this.Al | 0, Ah | 0, Al | 0));
        ({ h: Bh, l: Bl } = _u64_js__WEBPACK_IMPORTED_MODULE_1__["default"].add(this.Bh | 0, this.Bl | 0, Bh | 0, Bl | 0));
        ({ h: Ch, l: Cl } = _u64_js__WEBPACK_IMPORTED_MODULE_1__["default"].add(this.Ch | 0, this.Cl | 0, Ch | 0, Cl | 0));
        ({ h: Dh, l: Dl } = _u64_js__WEBPACK_IMPORTED_MODULE_1__["default"].add(this.Dh | 0, this.Dl | 0, Dh | 0, Dl | 0));
        ({ h: Eh, l: El } = _u64_js__WEBPACK_IMPORTED_MODULE_1__["default"].add(this.Eh | 0, this.El | 0, Eh | 0, El | 0));
        ({ h: Fh, l: Fl } = _u64_js__WEBPACK_IMPORTED_MODULE_1__["default"].add(this.Fh | 0, this.Fl | 0, Fh | 0, Fl | 0));
        ({ h: Gh, l: Gl } = _u64_js__WEBPACK_IMPORTED_MODULE_1__["default"].add(this.Gh | 0, this.Gl | 0, Gh | 0, Gl | 0));
        ({ h: Hh, l: Hl } = _u64_js__WEBPACK_IMPORTED_MODULE_1__["default"].add(this.Hh | 0, this.Hl | 0, Hh | 0, Hl | 0));
        this.set(Ah, Al, Bh, Bl, Ch, Cl, Dh, Dl, Eh, El, Fh, Fl, Gh, Gl, Hh, Hl);
    }
    roundClean() {
        SHA512_W_H.fill(0);
        SHA512_W_L.fill(0);
    }
    destroy() {
        this.buffer.fill(0);
        this.set(0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0);
    }
}
class SHA512_256 extends SHA512 {
    constructor() {
        super();
        // h -- high 32 bits, l -- low 32 bits
        this.Ah = 0x22312194 | 0;
        this.Al = 0xfc2bf72c | 0;
        this.Bh = 0x9f555fa3 | 0;
        this.Bl = 0xc84c64c2 | 0;
        this.Ch = 0x2393b86b | 0;
        this.Cl = 0x6f53b151 | 0;
        this.Dh = 0x96387719 | 0;
        this.Dl = 0x5940eabd | 0;
        this.Eh = 0x96283ee2 | 0;
        this.El = 0xa88effe3 | 0;
        this.Fh = 0xbe5e1e25 | 0;
        this.Fl = 0x53863992 | 0;
        this.Gh = 0x2b0199fc | 0;
        this.Gl = 0x2c85b8aa | 0;
        this.Hh = 0x0eb72ddc | 0;
        this.Hl = 0x81c52ca2 | 0;
        this.outputLen = 32;
    }
}
class SHA384 extends SHA512 {
    constructor() {
        super();
        // h -- high 32 bits, l -- low 32 bits
        this.Ah = 0xcbbb9d5d | 0;
        this.Al = 0xc1059ed8 | 0;
        this.Bh = 0x629a292a | 0;
        this.Bl = 0x367cd507 | 0;
        this.Ch = 0x9159015a | 0;
        this.Cl = 0x3070dd17 | 0;
        this.Dh = 0x152fecd8 | 0;
        this.Dl = 0xf70e5939 | 0;
        this.Eh = 0x67332667 | 0;
        this.El = 0xffc00b31 | 0;
        this.Fh = 0x8eb44a87 | 0;
        this.Fl = 0x68581511 | 0;
        this.Gh = 0xdb0c2e0d | 0;
        this.Gl = 0x64f98fa7 | 0;
        this.Hh = 0x47b5481d | 0;
        this.Hl = 0xbefa4fa4 | 0;
        this.outputLen = 48;
    }
}
const sha512 = (0,_utils_js__WEBPACK_IMPORTED_MODULE_2__.wrapConstructor)(() => new SHA512());
const sha512_256 = (0,_utils_js__WEBPACK_IMPORTED_MODULE_2__.wrapConstructor)(() => new SHA512_256());
const sha384 = (0,_utils_js__WEBPACK_IMPORTED_MODULE_2__.wrapConstructor)(() => new SHA384());


/***/ }),

/***/ "./node_modules/@noble/hashes/esm/utils.js":
/*!*************************************************!*\
  !*** ./node_modules/@noble/hashes/esm/utils.js ***!
  \*************************************************/
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "Hash": () => (/* binding */ Hash),
/* harmony export */   "asyncLoop": () => (/* binding */ asyncLoop),
/* harmony export */   "bytesToHex": () => (/* binding */ bytesToHex),
/* harmony export */   "checkOpts": () => (/* binding */ checkOpts),
/* harmony export */   "concatBytes": () => (/* binding */ concatBytes),
/* harmony export */   "createView": () => (/* binding */ createView),
/* harmony export */   "hexToBytes": () => (/* binding */ hexToBytes),
/* harmony export */   "isLE": () => (/* binding */ isLE),
/* harmony export */   "nextTick": () => (/* binding */ nextTick),
/* harmony export */   "randomBytes": () => (/* binding */ randomBytes),
/* harmony export */   "rotr": () => (/* binding */ rotr),
/* harmony export */   "toBytes": () => (/* binding */ toBytes),
/* harmony export */   "u32": () => (/* binding */ u32),
/* harmony export */   "u8": () => (/* binding */ u8),
/* harmony export */   "utf8ToBytes": () => (/* binding */ utf8ToBytes),
/* harmony export */   "wrapConstructor": () => (/* binding */ wrapConstructor),
/* harmony export */   "wrapConstructorWithOpts": () => (/* binding */ wrapConstructorWithOpts)
/* harmony export */ });
/* harmony import */ var _noble_hashes_crypto__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @noble/hashes/crypto */ "./node_modules/@noble/hashes/esm/cryptoBrowser.js");
/*! noble-hashes - MIT License (c) 2022 Paul Miller (paulmillr.com) */
// The import here is via the package name. This is to ensure
// that exports mapping/resolution does fall into place.

// Cast array to different type
const u8 = (arr) => new Uint8Array(arr.buffer, arr.byteOffset, arr.byteLength);
const u32 = (arr) => new Uint32Array(arr.buffer, arr.byteOffset, Math.floor(arr.byteLength / 4));
// Cast array to view
const createView = (arr) => new DataView(arr.buffer, arr.byteOffset, arr.byteLength);
// The rotate right (circular right shift) operation for uint32
const rotr = (word, shift) => (word << (32 - shift)) | (word >>> shift);
const isLE = new Uint8Array(new Uint32Array([0x11223344]).buffer)[0] === 0x44;
// There is almost no big endian hardware, but js typed arrays uses platform specific endianness.
// So, just to be sure not to corrupt anything.
if (!isLE)
    throw new Error('Non little-endian hardware is not supported');
const hexes = Array.from({ length: 256 }, (v, i) => i.toString(16).padStart(2, '0'));
/**
 * @example bytesToHex(Uint8Array.from([0xde, 0xad, 0xbe, 0xef]))
 */
function bytesToHex(uint8a) {
    // pre-caching improves the speed 6x
    if (!(uint8a instanceof Uint8Array))
        throw new Error('Uint8Array expected');
    let hex = '';
    for (let i = 0; i < uint8a.length; i++) {
        hex += hexes[uint8a[i]];
    }
    return hex;
}
/**
 * @example hexToBytes('deadbeef')
 */
function hexToBytes(hex) {
    if (typeof hex !== 'string') {
        throw new TypeError('hexToBytes: expected string, got ' + typeof hex);
    }
    if (hex.length % 2)
        throw new Error('hexToBytes: received invalid unpadded hex');
    const array = new Uint8Array(hex.length / 2);
    for (let i = 0; i < array.length; i++) {
        const j = i * 2;
        const hexByte = hex.slice(j, j + 2);
        const byte = Number.parseInt(hexByte, 16);
        if (Number.isNaN(byte) || byte < 0)
            throw new Error('Invalid byte sequence');
        array[i] = byte;
    }
    return array;
}
// There is no setImmediate in browser and setTimeout is slow. However, call to async function will return Promise
// which will be fullfiled only on next scheduler queue processing step and this is exactly what we need.
const nextTick = async () => { };
// Returns control to thread each 'tick' ms to avoid blocking
async function asyncLoop(iters, tick, cb) {
    let ts = Date.now();
    for (let i = 0; i < iters; i++) {
        cb(i);
        // Date.now() is not monotonic, so in case if clock goes backwards we return return control too
        const diff = Date.now() - ts;
        if (diff >= 0 && diff < tick)
            continue;
        await nextTick();
        ts += diff;
    }
}
function utf8ToBytes(str) {
    if (typeof str !== 'string') {
        throw new TypeError(`utf8ToBytes expected string, got ${typeof str}`);
    }
    return new TextEncoder().encode(str);
}
function toBytes(data) {
    if (typeof data === 'string')
        data = utf8ToBytes(data);
    if (!(data instanceof Uint8Array))
        throw new TypeError(`Expected input type is Uint8Array (got ${typeof data})`);
    return data;
}
/**
 * Concats Uint8Array-s into one; like `Buffer.concat([buf1, buf2])`
 * @example concatBytes(buf1, buf2)
 */
function concatBytes(...arrays) {
    if (!arrays.every((a) => a instanceof Uint8Array))
        throw new Error('Uint8Array list expected');
    if (arrays.length === 1)
        return arrays[0];
    const length = arrays.reduce((a, arr) => a + arr.length, 0);
    const result = new Uint8Array(length);
    for (let i = 0, pad = 0; i < arrays.length; i++) {
        const arr = arrays[i];
        result.set(arr, pad);
        pad += arr.length;
    }
    return result;
}
// For runtime check if class implements interface
class Hash {
    // Safe version that clones internal state
    clone() {
        return this._cloneInto();
    }
}
// Check if object doens't have custom constructor (like Uint8Array/Array)
const isPlainObject = (obj) => Object.prototype.toString.call(obj) === '[object Object]' && obj.constructor === Object;
function checkOpts(defaults, opts) {
    if (opts !== undefined && (typeof opts !== 'object' || !isPlainObject(opts)))
        throw new TypeError('Options should be object or undefined');
    const merged = Object.assign(defaults, opts);
    return merged;
}
function wrapConstructor(hashConstructor) {
    const hashC = (message) => hashConstructor().update(toBytes(message)).digest();
    const tmp = hashConstructor();
    hashC.outputLen = tmp.outputLen;
    hashC.blockLen = tmp.blockLen;
    hashC.create = () => hashConstructor();
    return hashC;
}
function wrapConstructorWithOpts(hashCons) {
    const hashC = (msg, opts) => hashCons(opts).update(toBytes(msg)).digest();
    const tmp = hashCons({});
    hashC.outputLen = tmp.outputLen;
    hashC.blockLen = tmp.blockLen;
    hashC.create = (opts) => hashCons(opts);
    return hashC;
}
/**
 * Secure PRNG
 */
function randomBytes(bytesLength = 32) {
    if (_noble_hashes_crypto__WEBPACK_IMPORTED_MODULE_0__.crypto.web) {
        return _noble_hashes_crypto__WEBPACK_IMPORTED_MODULE_0__.crypto.web.getRandomValues(new Uint8Array(bytesLength));
    }
    else if (_noble_hashes_crypto__WEBPACK_IMPORTED_MODULE_0__.crypto.node) {
        return new Uint8Array(_noble_hashes_crypto__WEBPACK_IMPORTED_MODULE_0__.crypto.node.randomBytes(bytesLength).buffer);
    }
    else {
        throw new Error("The environment doesn't have randomBytes function");
    }
}


/***/ }),

/***/ "./node_modules/@noble/secp256k1/lib/esm/index.js":
/*!********************************************************!*\
  !*** ./node_modules/@noble/secp256k1/lib/esm/index.js ***!
  \********************************************************/
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

"use strict";
var crypto__WEBPACK_IMPORTED_MODULE_0___namespace_cache;
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "CURVE": () => (/* binding */ CURVE),
/* harmony export */   "Point": () => (/* binding */ Point),
/* harmony export */   "Signature": () => (/* binding */ Signature),
/* harmony export */   "getPublicKey": () => (/* binding */ getPublicKey),
/* harmony export */   "getSharedSecret": () => (/* binding */ getSharedSecret),
/* harmony export */   "recoverPublicKey": () => (/* binding */ recoverPublicKey),
/* harmony export */   "schnorr": () => (/* binding */ schnorr),
/* harmony export */   "sign": () => (/* binding */ sign),
/* harmony export */   "signSync": () => (/* binding */ signSync),
/* harmony export */   "utils": () => (/* binding */ utils),
/* harmony export */   "verify": () => (/* binding */ verify)
/* harmony export */ });
/* harmony import */ var crypto__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! crypto */ "?ce41");
/*! noble-secp256k1 - MIT License (c) 2019 Paul Miller (paulmillr.com) */

const _0n = BigInt(0);
const _1n = BigInt(1);
const _2n = BigInt(2);
const _3n = BigInt(3);
const _8n = BigInt(8);
const CURVE = Object.freeze({
    a: _0n,
    b: BigInt(7),
    P: BigInt('0xfffffffffffffffffffffffffffffffffffffffffffffffffffffffefffffc2f'),
    n: BigInt('0xfffffffffffffffffffffffffffffffebaaedce6af48a03bbfd25e8cd0364141'),
    h: _1n,
    Gx: BigInt('55066263022277343669578718895168534326250603453777594175500187360389116729240'),
    Gy: BigInt('32670510020758816978083085130507043184471273380659243275938904335757337482424'),
    beta: BigInt('0x7ae96a2b657c07106e64479eac3434e99cf0497512f58995c1396c28719501ee'),
});
const divNearest = (a, b) => (a + b / _2n) / b;
const endo = {
    beta: BigInt('0x7ae96a2b657c07106e64479eac3434e99cf0497512f58995c1396c28719501ee'),
    splitScalar(k) {
        const { n } = CURVE;
        const a1 = BigInt('0x3086d221a7d46bcde86c90e49284eb15');
        const b1 = -_1n * BigInt('0xe4437ed6010e88286f547fa90abfe4c3');
        const a2 = BigInt('0x114ca50f7a8e2f3f657c1108d9d44cfd8');
        const b2 = a1;
        const POW_2_128 = BigInt('0x100000000000000000000000000000000');
        const c1 = divNearest(b2 * k, n);
        const c2 = divNearest(-b1 * k, n);
        let k1 = mod(k - c1 * a1 - c2 * a2, n);
        let k2 = mod(-c1 * b1 - c2 * b2, n);
        const k1neg = k1 > POW_2_128;
        const k2neg = k2 > POW_2_128;
        if (k1neg)
            k1 = n - k1;
        if (k2neg)
            k2 = n - k2;
        if (k1 > POW_2_128 || k2 > POW_2_128) {
            throw new Error('splitScalarEndo: Endomorphism failed, k=' + k);
        }
        return { k1neg, k1, k2neg, k2 };
    },
};
const fieldLen = 32;
const groupLen = 32;
const hashLen = 32;
const compressedLen = fieldLen + 1;
const uncompressedLen = 2 * fieldLen + 1;

function weierstrass(x) {
    const { a, b } = CURVE;
    const x2 = mod(x * x);
    const x3 = mod(x2 * x);
    return mod(x3 + a * x + b);
}
const USE_ENDOMORPHISM = CURVE.a === _0n;
class ShaError extends Error {
    constructor(message) {
        super(message);
    }
}
function assertJacPoint(other) {
    if (!(other instanceof JacobianPoint))
        throw new TypeError('JacobianPoint expected');
}
class JacobianPoint {
    constructor(x, y, z) {
        this.x = x;
        this.y = y;
        this.z = z;
    }
    static fromAffine(p) {
        if (!(p instanceof Point)) {
            throw new TypeError('JacobianPoint#fromAffine: expected Point');
        }
        if (p.equals(Point.ZERO))
            return JacobianPoint.ZERO;
        return new JacobianPoint(p.x, p.y, _1n);
    }
    static toAffineBatch(points) {
        const toInv = invertBatch(points.map((p) => p.z));
        return points.map((p, i) => p.toAffine(toInv[i]));
    }
    static normalizeZ(points) {
        return JacobianPoint.toAffineBatch(points).map(JacobianPoint.fromAffine);
    }
    equals(other) {
        assertJacPoint(other);
        const { x: X1, y: Y1, z: Z1 } = this;
        const { x: X2, y: Y2, z: Z2 } = other;
        const Z1Z1 = mod(Z1 * Z1);
        const Z2Z2 = mod(Z2 * Z2);
        const U1 = mod(X1 * Z2Z2);
        const U2 = mod(X2 * Z1Z1);
        const S1 = mod(mod(Y1 * Z2) * Z2Z2);
        const S2 = mod(mod(Y2 * Z1) * Z1Z1);
        return U1 === U2 && S1 === S2;
    }
    negate() {
        return new JacobianPoint(this.x, mod(-this.y), this.z);
    }
    double() {
        const { x: X1, y: Y1, z: Z1 } = this;
        const A = mod(X1 * X1);
        const B = mod(Y1 * Y1);
        const C = mod(B * B);
        const x1b = X1 + B;
        const D = mod(_2n * (mod(x1b * x1b) - A - C));
        const E = mod(_3n * A);
        const F = mod(E * E);
        const X3 = mod(F - _2n * D);
        const Y3 = mod(E * (D - X3) - _8n * C);
        const Z3 = mod(_2n * Y1 * Z1);
        return new JacobianPoint(X3, Y3, Z3);
    }
    add(other) {
        assertJacPoint(other);
        const { x: X1, y: Y1, z: Z1 } = this;
        const { x: X2, y: Y2, z: Z2 } = other;
        if (X2 === _0n || Y2 === _0n)
            return this;
        if (X1 === _0n || Y1 === _0n)
            return other;
        const Z1Z1 = mod(Z1 * Z1);
        const Z2Z2 = mod(Z2 * Z2);
        const U1 = mod(X1 * Z2Z2);
        const U2 = mod(X2 * Z1Z1);
        const S1 = mod(mod(Y1 * Z2) * Z2Z2);
        const S2 = mod(mod(Y2 * Z1) * Z1Z1);
        const H = mod(U2 - U1);
        const r = mod(S2 - S1);
        if (H === _0n) {
            if (r === _0n) {
                return this.double();
            }
            else {
                return JacobianPoint.ZERO;
            }
        }
        const HH = mod(H * H);
        const HHH = mod(H * HH);
        const V = mod(U1 * HH);
        const X3 = mod(r * r - HHH - _2n * V);
        const Y3 = mod(r * (V - X3) - S1 * HHH);
        const Z3 = mod(Z1 * Z2 * H);
        return new JacobianPoint(X3, Y3, Z3);
    }
    subtract(other) {
        return this.add(other.negate());
    }
    multiplyUnsafe(scalar) {
        const P0 = JacobianPoint.ZERO;
        if (typeof scalar === 'bigint' && scalar === _0n)
            return P0;
        let n = normalizeScalar(scalar);
        if (n === _1n)
            return this;
        if (!USE_ENDOMORPHISM) {
            let p = P0;
            let d = this;
            while (n > _0n) {
                if (n & _1n)
                    p = p.add(d);
                d = d.double();
                n >>= _1n;
            }
            return p;
        }
        let { k1neg, k1, k2neg, k2 } = endo.splitScalar(n);
        let k1p = P0;
        let k2p = P0;
        let d = this;
        while (k1 > _0n || k2 > _0n) {
            if (k1 & _1n)
                k1p = k1p.add(d);
            if (k2 & _1n)
                k2p = k2p.add(d);
            d = d.double();
            k1 >>= _1n;
            k2 >>= _1n;
        }
        if (k1neg)
            k1p = k1p.negate();
        if (k2neg)
            k2p = k2p.negate();
        k2p = new JacobianPoint(mod(k2p.x * endo.beta), k2p.y, k2p.z);
        return k1p.add(k2p);
    }
    precomputeWindow(W) {
        const windows = USE_ENDOMORPHISM ? 128 / W + 1 : 256 / W + 1;
        const points = [];
        let p = this;
        let base = p;
        for (let window = 0; window < windows; window++) {
            base = p;
            points.push(base);
            for (let i = 1; i < 2 ** (W - 1); i++) {
                base = base.add(p);
                points.push(base);
            }
            p = base.double();
        }
        return points;
    }
    wNAF(n, affinePoint) {
        if (!affinePoint && this.equals(JacobianPoint.BASE))
            affinePoint = Point.BASE;
        const W = (affinePoint && affinePoint._WINDOW_SIZE) || 1;
        if (256 % W) {
            throw new Error('Point#wNAF: Invalid precomputation window, must be power of 2');
        }
        let precomputes = affinePoint && pointPrecomputes.get(affinePoint);
        if (!precomputes) {
            precomputes = this.precomputeWindow(W);
            if (affinePoint && W !== 1) {
                precomputes = JacobianPoint.normalizeZ(precomputes);
                pointPrecomputes.set(affinePoint, precomputes);
            }
        }
        let p = JacobianPoint.ZERO;
        let f = JacobianPoint.BASE;
        const windows = 1 + (USE_ENDOMORPHISM ? 128 / W : 256 / W);
        const windowSize = 2 ** (W - 1);
        const mask = BigInt(2 ** W - 1);
        const maxNumber = 2 ** W;
        const shiftBy = BigInt(W);
        for (let window = 0; window < windows; window++) {
            const offset = window * windowSize;
            let wbits = Number(n & mask);
            n >>= shiftBy;
            if (wbits > windowSize) {
                wbits -= maxNumber;
                n += _1n;
            }
            const offset1 = offset;
            const offset2 = offset + Math.abs(wbits) - 1;
            const cond1 = window % 2 !== 0;
            const cond2 = wbits < 0;
            if (wbits === 0) {
                f = f.add(constTimeNegate(cond1, precomputes[offset1]));
            }
            else {
                p = p.add(constTimeNegate(cond2, precomputes[offset2]));
            }
        }
        return { p, f };
    }
    multiply(scalar, affinePoint) {
        let n = normalizeScalar(scalar);
        let point;
        let fake;
        if (USE_ENDOMORPHISM) {
            const { k1neg, k1, k2neg, k2 } = endo.splitScalar(n);
            let { p: k1p, f: f1p } = this.wNAF(k1, affinePoint);
            let { p: k2p, f: f2p } = this.wNAF(k2, affinePoint);
            k1p = constTimeNegate(k1neg, k1p);
            k2p = constTimeNegate(k2neg, k2p);
            k2p = new JacobianPoint(mod(k2p.x * endo.beta), k2p.y, k2p.z);
            point = k1p.add(k2p);
            fake = f1p.add(f2p);
        }
        else {
            const { p, f } = this.wNAF(n, affinePoint);
            point = p;
            fake = f;
        }
        return JacobianPoint.normalizeZ([point, fake])[0];
    }
    toAffine(invZ) {
        const { x, y, z } = this;
        const is0 = this.equals(JacobianPoint.ZERO);
        if (invZ == null)
            invZ = is0 ? _8n : invert(z);
        const iz1 = invZ;
        const iz2 = mod(iz1 * iz1);
        const iz3 = mod(iz2 * iz1);
        const ax = mod(x * iz2);
        const ay = mod(y * iz3);
        const zz = mod(z * iz1);
        if (is0)
            return Point.ZERO;
        if (zz !== _1n)
            throw new Error('invZ was invalid');
        return new Point(ax, ay);
    }
}
JacobianPoint.BASE = new JacobianPoint(CURVE.Gx, CURVE.Gy, _1n);
JacobianPoint.ZERO = new JacobianPoint(_0n, _1n, _0n);
function constTimeNegate(condition, item) {
    const neg = item.negate();
    return condition ? neg : item;
}
const pointPrecomputes = new WeakMap();
class Point {
    constructor(x, y) {
        this.x = x;
        this.y = y;
    }
    _setWindowSize(windowSize) {
        this._WINDOW_SIZE = windowSize;
        pointPrecomputes.delete(this);
    }
    hasEvenY() {
        return this.y % _2n === _0n;
    }
    static fromCompressedHex(bytes) {
        const isShort = bytes.length === 32;
        const x = bytesToNumber(isShort ? bytes : bytes.subarray(1));
        if (!isValidFieldElement(x))
            throw new Error('Point is not on curve');
        const y2 = weierstrass(x);
        let y = sqrtMod(y2);
        const isYOdd = (y & _1n) === _1n;
        if (isShort) {
            if (isYOdd)
                y = mod(-y);
        }
        else {
            const isFirstByteOdd = (bytes[0] & 1) === 1;
            if (isFirstByteOdd !== isYOdd)
                y = mod(-y);
        }
        const point = new Point(x, y);
        point.assertValidity();
        return point;
    }
    static fromUncompressedHex(bytes) {
        const x = bytesToNumber(bytes.subarray(1, fieldLen + 1));
        const y = bytesToNumber(bytes.subarray(fieldLen + 1, fieldLen * 2 + 1));
        const point = new Point(x, y);
        point.assertValidity();
        return point;
    }
    static fromHex(hex) {
        const bytes = ensureBytes(hex);
        const len = bytes.length;
        const header = bytes[0];
        if (len === fieldLen)
            return this.fromCompressedHex(bytes);
        if (len === compressedLen && (header === 0x02 || header === 0x03)) {
            return this.fromCompressedHex(bytes);
        }
        if (len === uncompressedLen && header === 0x04)
            return this.fromUncompressedHex(bytes);
        throw new Error(`Point.fromHex: received invalid point. Expected 32-${compressedLen} compressed bytes or ${uncompressedLen} uncompressed bytes, not ${len}`);
    }
    static fromPrivateKey(privateKey) {
        return Point.BASE.multiply(normalizePrivateKey(privateKey));
    }
    static fromSignature(msgHash, signature, recovery) {
        const { r, s } = normalizeSignature(signature);
        if (![0, 1, 2, 3].includes(recovery))
            throw new Error('Cannot recover: invalid recovery bit');
        const h = truncateHash(ensureBytes(msgHash));
        const { n } = CURVE;
        const radj = recovery === 2 || recovery === 3 ? r + n : r;
        const rinv = invert(radj, n);
        const u1 = mod(-h * rinv, n);
        const u2 = mod(s * rinv, n);
        const prefix = recovery & 1 ? '03' : '02';
        const R = Point.fromHex(prefix + numTo32bStr(radj));
        const Q = Point.BASE.multiplyAndAddUnsafe(R, u1, u2);
        if (!Q)
            throw new Error('Cannot recover signature: point at infinify');
        Q.assertValidity();
        return Q;
    }
    toRawBytes(isCompressed = false) {
        return hexToBytes(this.toHex(isCompressed));
    }
    toHex(isCompressed = false) {
        const x = numTo32bStr(this.x);
        if (isCompressed) {
            const prefix = this.hasEvenY() ? '02' : '03';
            return `${prefix}${x}`;
        }
        else {
            return `04${x}${numTo32bStr(this.y)}`;
        }
    }
    toHexX() {
        return this.toHex(true).slice(2);
    }
    toRawX() {
        return this.toRawBytes(true).slice(1);
    }
    assertValidity() {
        const msg = 'Point is not on elliptic curve';
        const { x, y } = this;
        if (!isValidFieldElement(x) || !isValidFieldElement(y))
            throw new Error(msg);
        const left = mod(y * y);
        const right = weierstrass(x);
        if (mod(left - right) !== _0n)
            throw new Error(msg);
    }
    equals(other) {
        return this.x === other.x && this.y === other.y;
    }
    negate() {
        return new Point(this.x, mod(-this.y));
    }
    double() {
        return JacobianPoint.fromAffine(this).double().toAffine();
    }
    add(other) {
        return JacobianPoint.fromAffine(this).add(JacobianPoint.fromAffine(other)).toAffine();
    }
    subtract(other) {
        return this.add(other.negate());
    }
    multiply(scalar) {
        return JacobianPoint.fromAffine(this).multiply(scalar, this).toAffine();
    }
    multiplyAndAddUnsafe(Q, a, b) {
        const P = JacobianPoint.fromAffine(this);
        const aP = a === _0n || a === _1n || this !== Point.BASE ? P.multiplyUnsafe(a) : P.multiply(a);
        const bQ = JacobianPoint.fromAffine(Q).multiplyUnsafe(b);
        const sum = aP.add(bQ);
        return sum.equals(JacobianPoint.ZERO) ? undefined : sum.toAffine();
    }
}
Point.BASE = new Point(CURVE.Gx, CURVE.Gy);
Point.ZERO = new Point(_0n, _0n);
function sliceDER(s) {
    return Number.parseInt(s[0], 16) >= 8 ? '00' + s : s;
}
function parseDERInt(data) {
    if (data.length < 2 || data[0] !== 0x02) {
        throw new Error(`Invalid signature integer tag: ${bytesToHex(data)}`);
    }
    const len = data[1];
    const res = data.subarray(2, len + 2);
    if (!len || res.length !== len) {
        throw new Error(`Invalid signature integer: wrong length`);
    }
    if (res[0] === 0x00 && res[1] <= 0x7f) {
        throw new Error('Invalid signature integer: trailing length');
    }
    return { data: bytesToNumber(res), left: data.subarray(len + 2) };
}
function parseDERSignature(data) {
    if (data.length < 2 || data[0] != 0x30) {
        throw new Error(`Invalid signature tag: ${bytesToHex(data)}`);
    }
    if (data[1] !== data.length - 2) {
        throw new Error('Invalid signature: incorrect length');
    }
    const { data: r, left: sBytes } = parseDERInt(data.subarray(2));
    const { data: s, left: rBytesLeft } = parseDERInt(sBytes);
    if (rBytesLeft.length) {
        throw new Error(`Invalid signature: left bytes after parsing: ${bytesToHex(rBytesLeft)}`);
    }
    return { r, s };
}
class Signature {
    constructor(r, s) {
        this.r = r;
        this.s = s;
        this.assertValidity();
    }
    static fromCompact(hex) {
        const arr = hex instanceof Uint8Array;
        const name = 'Signature.fromCompact';
        if (typeof hex !== 'string' && !arr)
            throw new TypeError(`${name}: Expected string or Uint8Array`);
        const str = arr ? bytesToHex(hex) : hex;
        if (str.length !== 128)
            throw new Error(`${name}: Expected 64-byte hex`);
        return new Signature(hexToNumber(str.slice(0, 64)), hexToNumber(str.slice(64, 128)));
    }
    static fromDER(hex) {
        const arr = hex instanceof Uint8Array;
        if (typeof hex !== 'string' && !arr)
            throw new TypeError(`Signature.fromDER: Expected string or Uint8Array`);
        const { r, s } = parseDERSignature(arr ? hex : hexToBytes(hex));
        return new Signature(r, s);
    }
    static fromHex(hex) {
        return this.fromDER(hex);
    }
    assertValidity() {
        const { r, s } = this;
        if (!isWithinCurveOrder(r))
            throw new Error('Invalid Signature: r must be 0 < r < n');
        if (!isWithinCurveOrder(s))
            throw new Error('Invalid Signature: s must be 0 < s < n');
    }
    hasHighS() {
        const HALF = CURVE.n >> _1n;
        return this.s > HALF;
    }
    normalizeS() {
        return this.hasHighS() ? new Signature(this.r, mod(-this.s, CURVE.n)) : this;
    }
    toDERRawBytes() {
        return hexToBytes(this.toDERHex());
    }
    toDERHex() {
        const sHex = sliceDER(numberToHexUnpadded(this.s));
        const rHex = sliceDER(numberToHexUnpadded(this.r));
        const sHexL = sHex.length / 2;
        const rHexL = rHex.length / 2;
        const sLen = numberToHexUnpadded(sHexL);
        const rLen = numberToHexUnpadded(rHexL);
        const length = numberToHexUnpadded(rHexL + sHexL + 4);
        return `30${length}02${rLen}${rHex}02${sLen}${sHex}`;
    }
    toRawBytes() {
        return this.toDERRawBytes();
    }
    toHex() {
        return this.toDERHex();
    }
    toCompactRawBytes() {
        return hexToBytes(this.toCompactHex());
    }
    toCompactHex() {
        return numTo32bStr(this.r) + numTo32bStr(this.s);
    }
}
function concatBytes(...arrays) {
    if (!arrays.every((b) => b instanceof Uint8Array))
        throw new Error('Uint8Array list expected');
    if (arrays.length === 1)
        return arrays[0];
    const length = arrays.reduce((a, arr) => a + arr.length, 0);
    const result = new Uint8Array(length);
    for (let i = 0, pad = 0; i < arrays.length; i++) {
        const arr = arrays[i];
        result.set(arr, pad);
        pad += arr.length;
    }
    return result;
}
const hexes = Array.from({ length: 256 }, (v, i) => i.toString(16).padStart(2, '0'));
function bytesToHex(uint8a) {
    if (!(uint8a instanceof Uint8Array))
        throw new Error('Expected Uint8Array');
    let hex = '';
    for (let i = 0; i < uint8a.length; i++) {
        hex += hexes[uint8a[i]];
    }
    return hex;
}
const POW_2_256 = BigInt('0x10000000000000000000000000000000000000000000000000000000000000000');
function numTo32bStr(num) {
    if (typeof num !== 'bigint')
        throw new Error('Expected bigint');
    if (!(_0n <= num && num < POW_2_256))
        throw new Error('Expected number 0 <= n < 2^256');
    return num.toString(16).padStart(64, '0');
}
function numTo32b(num) {
    const b = hexToBytes(numTo32bStr(num));
    if (b.length !== 32)
        throw new Error('Error: expected 32 bytes');
    return b;
}
function numberToHexUnpadded(num) {
    const hex = num.toString(16);
    return hex.length & 1 ? `0${hex}` : hex;
}
function hexToNumber(hex) {
    if (typeof hex !== 'string') {
        throw new TypeError('hexToNumber: expected string, got ' + typeof hex);
    }
    return BigInt(`0x${hex}`);
}
function hexToBytes(hex) {
    if (typeof hex !== 'string') {
        throw new TypeError('hexToBytes: expected string, got ' + typeof hex);
    }
    if (hex.length % 2)
        throw new Error('hexToBytes: received invalid unpadded hex' + hex.length);
    const array = new Uint8Array(hex.length / 2);
    for (let i = 0; i < array.length; i++) {
        const j = i * 2;
        const hexByte = hex.slice(j, j + 2);
        const byte = Number.parseInt(hexByte, 16);
        if (Number.isNaN(byte) || byte < 0)
            throw new Error('Invalid byte sequence');
        array[i] = byte;
    }
    return array;
}
function bytesToNumber(bytes) {
    return hexToNumber(bytesToHex(bytes));
}
function ensureBytes(hex) {
    return hex instanceof Uint8Array ? Uint8Array.from(hex) : hexToBytes(hex);
}
function normalizeScalar(num) {
    if (typeof num === 'number' && Number.isSafeInteger(num) && num > 0)
        return BigInt(num);
    if (typeof num === 'bigint' && isWithinCurveOrder(num))
        return num;
    throw new TypeError('Expected valid private scalar: 0 < scalar < curve.n');
}
function mod(a, b = CURVE.P) {
    const result = a % b;
    return result >= _0n ? result : b + result;
}
function pow2(x, power) {
    const { P } = CURVE;
    let res = x;
    while (power-- > _0n) {
        res *= res;
        res %= P;
    }
    return res;
}
function sqrtMod(x) {
    const { P } = CURVE;
    const _6n = BigInt(6);
    const _11n = BigInt(11);
    const _22n = BigInt(22);
    const _23n = BigInt(23);
    const _44n = BigInt(44);
    const _88n = BigInt(88);
    const b2 = (x * x * x) % P;
    const b3 = (b2 * b2 * x) % P;
    const b6 = (pow2(b3, _3n) * b3) % P;
    const b9 = (pow2(b6, _3n) * b3) % P;
    const b11 = (pow2(b9, _2n) * b2) % P;
    const b22 = (pow2(b11, _11n) * b11) % P;
    const b44 = (pow2(b22, _22n) * b22) % P;
    const b88 = (pow2(b44, _44n) * b44) % P;
    const b176 = (pow2(b88, _88n) * b88) % P;
    const b220 = (pow2(b176, _44n) * b44) % P;
    const b223 = (pow2(b220, _3n) * b3) % P;
    const t1 = (pow2(b223, _23n) * b22) % P;
    const t2 = (pow2(t1, _6n) * b2) % P;
    const rt = pow2(t2, _2n);
    const xc = (rt * rt) % P;
    if (xc !== x)
        throw new Error('Cannot find square root');
    return rt;
}
function invert(number, modulo = CURVE.P) {
    if (number === _0n || modulo <= _0n) {
        throw new Error(`invert: expected positive integers, got n=${number} mod=${modulo}`);
    }
    let a = mod(number, modulo);
    let b = modulo;
    let x = _0n, y = _1n, u = _1n, v = _0n;
    while (a !== _0n) {
        const q = b / a;
        const r = b % a;
        const m = x - u * q;
        const n = y - v * q;
        b = a, a = r, x = u, y = v, u = m, v = n;
    }
    const gcd = b;
    if (gcd !== _1n)
        throw new Error('invert: does not exist');
    return mod(x, modulo);
}
function invertBatch(nums, p = CURVE.P) {
    const scratch = new Array(nums.length);
    const lastMultiplied = nums.reduce((acc, num, i) => {
        if (num === _0n)
            return acc;
        scratch[i] = acc;
        return mod(acc * num, p);
    }, _1n);
    const inverted = invert(lastMultiplied, p);
    nums.reduceRight((acc, num, i) => {
        if (num === _0n)
            return acc;
        scratch[i] = mod(acc * scratch[i], p);
        return mod(acc * num, p);
    }, inverted);
    return scratch;
}
function bits2int_2(bytes) {
    const delta = bytes.length * 8 - groupLen * 8;
    const num = bytesToNumber(bytes);
    return delta > 0 ? num >> BigInt(delta) : num;
}
function truncateHash(hash, truncateOnly = false) {
    const h = bits2int_2(hash);
    if (truncateOnly)
        return h;
    const { n } = CURVE;
    return h >= n ? h - n : h;
}
let _sha256Sync;
let _hmacSha256Sync;
class HmacDrbg {
    constructor(hashLen, qByteLen) {
        this.hashLen = hashLen;
        this.qByteLen = qByteLen;
        if (typeof hashLen !== 'number' || hashLen < 2)
            throw new Error('hashLen must be a number');
        if (typeof qByteLen !== 'number' || qByteLen < 2)
            throw new Error('qByteLen must be a number');
        this.v = new Uint8Array(hashLen).fill(1);
        this.k = new Uint8Array(hashLen).fill(0);
        this.counter = 0;
    }
    hmac(...values) {
        return utils.hmacSha256(this.k, ...values);
    }
    hmacSync(...values) {
        return _hmacSha256Sync(this.k, ...values);
    }
    checkSync() {
        if (typeof _hmacSha256Sync !== 'function')
            throw new ShaError('hmacSha256Sync needs to be set');
    }
    incr() {
        if (this.counter >= 1000)
            throw new Error('Tried 1,000 k values for sign(), all were invalid');
        this.counter += 1;
    }
    async reseed(seed = new Uint8Array()) {
        this.k = await this.hmac(this.v, Uint8Array.from([0x00]), seed);
        this.v = await this.hmac(this.v);
        if (seed.length === 0)
            return;
        this.k = await this.hmac(this.v, Uint8Array.from([0x01]), seed);
        this.v = await this.hmac(this.v);
    }
    reseedSync(seed = new Uint8Array()) {
        this.checkSync();
        this.k = this.hmacSync(this.v, Uint8Array.from([0x00]), seed);
        this.v = this.hmacSync(this.v);
        if (seed.length === 0)
            return;
        this.k = this.hmacSync(this.v, Uint8Array.from([0x01]), seed);
        this.v = this.hmacSync(this.v);
    }
    async generate() {
        this.incr();
        let len = 0;
        const out = [];
        while (len < this.qByteLen) {
            this.v = await this.hmac(this.v);
            const sl = this.v.slice();
            out.push(sl);
            len += this.v.length;
        }
        return concatBytes(...out);
    }
    generateSync() {
        this.checkSync();
        this.incr();
        let len = 0;
        const out = [];
        while (len < this.qByteLen) {
            this.v = this.hmacSync(this.v);
            const sl = this.v.slice();
            out.push(sl);
            len += this.v.length;
        }
        return concatBytes(...out);
    }
}
function isWithinCurveOrder(num) {
    return _0n < num && num < CURVE.n;
}
function isValidFieldElement(num) {
    return _0n < num && num < CURVE.P;
}
function kmdToSig(kBytes, m, d, lowS = true) {
    const { n } = CURVE;
    const k = truncateHash(kBytes, true);
    if (!isWithinCurveOrder(k))
        return;
    const kinv = invert(k, n);
    const q = Point.BASE.multiply(k);
    const r = mod(q.x, n);
    if (r === _0n)
        return;
    const s = mod(kinv * mod(m + d * r, n), n);
    if (s === _0n)
        return;
    let sig = new Signature(r, s);
    let recovery = (q.x === sig.r ? 0 : 2) | Number(q.y & _1n);
    if (lowS && sig.hasHighS()) {
        sig = sig.normalizeS();
        recovery ^= 1;
    }
    return { sig, recovery };
}
function normalizePrivateKey(key) {
    let num;
    if (typeof key === 'bigint') {
        num = key;
    }
    else if (typeof key === 'number' && Number.isSafeInteger(key) && key > 0) {
        num = BigInt(key);
    }
    else if (typeof key === 'string') {
        if (key.length !== 2 * groupLen)
            throw new Error('Expected 32 bytes of private key');
        num = hexToNumber(key);
    }
    else if (key instanceof Uint8Array) {
        if (key.length !== groupLen)
            throw new Error('Expected 32 bytes of private key');
        num = bytesToNumber(key);
    }
    else {
        throw new TypeError('Expected valid private key');
    }
    if (!isWithinCurveOrder(num))
        throw new Error('Expected private key: 0 < key < n');
    return num;
}
function normalizePublicKey(publicKey) {
    if (publicKey instanceof Point) {
        publicKey.assertValidity();
        return publicKey;
    }
    else {
        return Point.fromHex(publicKey);
    }
}
function normalizeSignature(signature) {
    if (signature instanceof Signature) {
        signature.assertValidity();
        return signature;
    }
    try {
        return Signature.fromDER(signature);
    }
    catch (error) {
        return Signature.fromCompact(signature);
    }
}
function getPublicKey(privateKey, isCompressed = false) {
    return Point.fromPrivateKey(privateKey).toRawBytes(isCompressed);
}
function recoverPublicKey(msgHash, signature, recovery, isCompressed = false) {
    return Point.fromSignature(msgHash, signature, recovery).toRawBytes(isCompressed);
}
function isProbPub(item) {
    const arr = item instanceof Uint8Array;
    const str = typeof item === 'string';
    const len = (arr || str) && item.length;
    if (arr)
        return len === compressedLen || len === uncompressedLen;
    if (str)
        return len === compressedLen * 2 || len === uncompressedLen * 2;
    if (item instanceof Point)
        return true;
    return false;
}
function getSharedSecret(privateA, publicB, isCompressed = false) {
    if (isProbPub(privateA))
        throw new TypeError('getSharedSecret: first arg must be private key');
    if (!isProbPub(publicB))
        throw new TypeError('getSharedSecret: second arg must be public key');
    const b = normalizePublicKey(publicB);
    b.assertValidity();
    return b.multiply(normalizePrivateKey(privateA)).toRawBytes(isCompressed);
}
function bits2int(bytes) {
    const slice = bytes.length > fieldLen ? bytes.slice(0, fieldLen) : bytes;
    return bytesToNumber(slice);
}
function bits2octets(bytes) {
    const z1 = bits2int(bytes);
    const z2 = mod(z1, CURVE.n);
    return int2octets(z2 < _0n ? z1 : z2);
}
function int2octets(num) {
    return numTo32b(num);
}
function initSigArgs(msgHash, privateKey, extraEntropy) {
    if (msgHash == null)
        throw new Error(`sign: expected valid message hash, not "${msgHash}"`);
    const h1 = ensureBytes(msgHash);
    const d = normalizePrivateKey(privateKey);
    const seedArgs = [int2octets(d), bits2octets(h1)];
    if (extraEntropy != null) {
        if (extraEntropy === true)
            extraEntropy = utils.randomBytes(fieldLen);
        const e = ensureBytes(extraEntropy);
        if (e.length !== fieldLen)
            throw new Error(`sign: Expected ${fieldLen} bytes of extra data`);
        seedArgs.push(e);
    }
    const seed = concatBytes(...seedArgs);
    const m = bits2int(h1);
    return { seed, m, d };
}
function finalizeSig(recSig, opts) {
    const { sig, recovery } = recSig;
    const { der, recovered } = Object.assign({ canonical: true, der: true }, opts);
    const hashed = der ? sig.toDERRawBytes() : sig.toCompactRawBytes();
    return recovered ? [hashed, recovery] : hashed;
}
async function sign(msgHash, privKey, opts = {}) {
    const { seed, m, d } = initSigArgs(msgHash, privKey, opts.extraEntropy);
    const drbg = new HmacDrbg(hashLen, groupLen);
    await drbg.reseed(seed);
    let sig;
    while (!(sig = kmdToSig(await drbg.generate(), m, d, opts.canonical)))
        await drbg.reseed();
    return finalizeSig(sig, opts);
}
function signSync(msgHash, privKey, opts = {}) {
    const { seed, m, d } = initSigArgs(msgHash, privKey, opts.extraEntropy);
    const drbg = new HmacDrbg(hashLen, groupLen);
    drbg.reseedSync(seed);
    let sig;
    while (!(sig = kmdToSig(drbg.generateSync(), m, d, opts.canonical)))
        drbg.reseedSync();
    return finalizeSig(sig, opts);
}

const vopts = { strict: true };
function verify(signature, msgHash, publicKey, opts = vopts) {
    let sig;
    try {
        sig = normalizeSignature(signature);
        msgHash = ensureBytes(msgHash);
    }
    catch (error) {
        return false;
    }
    const { r, s } = sig;
    if (opts.strict && sig.hasHighS())
        return false;
    const h = truncateHash(msgHash);
    let P;
    try {
        P = normalizePublicKey(publicKey);
    }
    catch (error) {
        return false;
    }
    const { n } = CURVE;
    const sinv = invert(s, n);
    const u1 = mod(h * sinv, n);
    const u2 = mod(r * sinv, n);
    const R = Point.BASE.multiplyAndAddUnsafe(P, u1, u2);
    if (!R)
        return false;
    const v = mod(R.x, n);
    return v === r;
}
function schnorrChallengeFinalize(ch) {
    return mod(bytesToNumber(ch), CURVE.n);
}
class SchnorrSignature {
    constructor(r, s) {
        this.r = r;
        this.s = s;
        this.assertValidity();
    }
    static fromHex(hex) {
        const bytes = ensureBytes(hex);
        if (bytes.length !== 64)
            throw new TypeError(`SchnorrSignature.fromHex: expected 64 bytes, not ${bytes.length}`);
        const r = bytesToNumber(bytes.subarray(0, 32));
        const s = bytesToNumber(bytes.subarray(32, 64));
        return new SchnorrSignature(r, s);
    }
    assertValidity() {
        const { r, s } = this;
        if (!isValidFieldElement(r) || !isWithinCurveOrder(s))
            throw new Error('Invalid signature');
    }
    toHex() {
        return numTo32bStr(this.r) + numTo32bStr(this.s);
    }
    toRawBytes() {
        return hexToBytes(this.toHex());
    }
}
function schnorrGetPublicKey(privateKey) {
    return Point.fromPrivateKey(privateKey).toRawX();
}
class InternalSchnorrSignature {
    constructor(message, privateKey, auxRand = utils.randomBytes()) {
        if (message == null)
            throw new TypeError(`sign: Expected valid message, not "${message}"`);
        this.m = ensureBytes(message);
        const { x, scalar } = this.getScalar(normalizePrivateKey(privateKey));
        this.px = x;
        this.d = scalar;
        this.rand = ensureBytes(auxRand);
        if (this.rand.length !== 32)
            throw new TypeError('sign: Expected 32 bytes of aux randomness');
    }
    getScalar(priv) {
        const point = Point.fromPrivateKey(priv);
        const scalar = point.hasEvenY() ? priv : CURVE.n - priv;
        return { point, scalar, x: point.toRawX() };
    }
    initNonce(d, t0h) {
        return numTo32b(d ^ bytesToNumber(t0h));
    }
    finalizeNonce(k0h) {
        const k0 = mod(bytesToNumber(k0h), CURVE.n);
        if (k0 === _0n)
            throw new Error('sign: Creation of signature failed. k is zero');
        const { point: R, x: rx, scalar: k } = this.getScalar(k0);
        return { R, rx, k };
    }
    finalizeSig(R, k, e, d) {
        return new SchnorrSignature(R.x, mod(k + e * d, CURVE.n)).toRawBytes();
    }
    error() {
        throw new Error('sign: Invalid signature produced');
    }
    async calc() {
        const { m, d, px, rand } = this;
        const tag = utils.taggedHash;
        const t = this.initNonce(d, await tag(TAGS.aux, rand));
        const { R, rx, k } = this.finalizeNonce(await tag(TAGS.nonce, t, px, m));
        const e = schnorrChallengeFinalize(await tag(TAGS.challenge, rx, px, m));
        const sig = this.finalizeSig(R, k, e, d);
        if (!(await schnorrVerify(sig, m, px)))
            this.error();
        return sig;
    }
    calcSync() {
        const { m, d, px, rand } = this;
        const tag = utils.taggedHashSync;
        const t = this.initNonce(d, tag(TAGS.aux, rand));
        const { R, rx, k } = this.finalizeNonce(tag(TAGS.nonce, t, px, m));
        const e = schnorrChallengeFinalize(tag(TAGS.challenge, rx, px, m));
        const sig = this.finalizeSig(R, k, e, d);
        if (!schnorrVerifySync(sig, m, px))
            this.error();
        return sig;
    }
}
async function schnorrSign(msg, privKey, auxRand) {
    return new InternalSchnorrSignature(msg, privKey, auxRand).calc();
}
function schnorrSignSync(msg, privKey, auxRand) {
    return new InternalSchnorrSignature(msg, privKey, auxRand).calcSync();
}
function initSchnorrVerify(signature, message, publicKey) {
    const raw = signature instanceof SchnorrSignature;
    const sig = raw ? signature : SchnorrSignature.fromHex(signature);
    if (raw)
        sig.assertValidity();
    return {
        ...sig,
        m: ensureBytes(message),
        P: normalizePublicKey(publicKey),
    };
}
function finalizeSchnorrVerify(r, P, s, e) {
    const R = Point.BASE.multiplyAndAddUnsafe(P, normalizePrivateKey(s), mod(-e, CURVE.n));
    if (!R || !R.hasEvenY() || R.x !== r)
        return false;
    return true;
}
async function schnorrVerify(signature, message, publicKey) {
    try {
        const { r, s, m, P } = initSchnorrVerify(signature, message, publicKey);
        const e = schnorrChallengeFinalize(await utils.taggedHash(TAGS.challenge, numTo32b(r), P.toRawX(), m));
        return finalizeSchnorrVerify(r, P, s, e);
    }
    catch (error) {
        return false;
    }
}
function schnorrVerifySync(signature, message, publicKey) {
    try {
        const { r, s, m, P } = initSchnorrVerify(signature, message, publicKey);
        const e = schnorrChallengeFinalize(utils.taggedHashSync(TAGS.challenge, numTo32b(r), P.toRawX(), m));
        return finalizeSchnorrVerify(r, P, s, e);
    }
    catch (error) {
        if (error instanceof ShaError)
            throw error;
        return false;
    }
}
const schnorr = {
    Signature: SchnorrSignature,
    getPublicKey: schnorrGetPublicKey,
    sign: schnorrSign,
    verify: schnorrVerify,
    signSync: schnorrSignSync,
    verifySync: schnorrVerifySync,
};
Point.BASE._setWindowSize(8);
const crypto = {
    node: /*#__PURE__*/ (crypto__WEBPACK_IMPORTED_MODULE_0___namespace_cache || (crypto__WEBPACK_IMPORTED_MODULE_0___namespace_cache = __webpack_require__.t(crypto__WEBPACK_IMPORTED_MODULE_0__, 2))),
    web: typeof self === 'object' && 'crypto' in self ? self.crypto : undefined,
};
const TAGS = {
    challenge: 'BIP0340/challenge',
    aux: 'BIP0340/aux',
    nonce: 'BIP0340/nonce',
};
const TAGGED_HASH_PREFIXES = {};
const utils = {
    bytesToHex,
    hexToBytes,
    concatBytes,
    mod,
    invert,
    isValidPrivateKey(privateKey) {
        try {
            normalizePrivateKey(privateKey);
            return true;
        }
        catch (error) {
            return false;
        }
    },
    _bigintTo32Bytes: numTo32b,
    _normalizePrivateKey: normalizePrivateKey,
    hashToPrivateKey: (hash) => {
        hash = ensureBytes(hash);
        const minLen = groupLen + 8;
        if (hash.length < minLen || hash.length > 1024) {
            throw new Error(`Expected valid bytes of private key as per FIPS 186`);
        }
        const num = mod(bytesToNumber(hash), CURVE.n - _1n) + _1n;
        return numTo32b(num);
    },
    randomBytes: (bytesLength = 32) => {
        if (crypto.web) {
            return crypto.web.getRandomValues(new Uint8Array(bytesLength));
        }
        else if (crypto.node) {
            const { randomBytes } = crypto.node;
            return Uint8Array.from(randomBytes(bytesLength));
        }
        else {
            throw new Error("The environment doesn't have randomBytes function");
        }
    },
    randomPrivateKey: () => utils.hashToPrivateKey(utils.randomBytes(groupLen + 8)),
    precompute(windowSize = 8, point = Point.BASE) {
        const cached = point === Point.BASE ? point : new Point(point.x, point.y);
        cached._setWindowSize(windowSize);
        cached.multiply(_3n);
        return cached;
    },
    sha256: async (...messages) => {
        if (crypto.web) {
            const buffer = await crypto.web.subtle.digest('SHA-256', concatBytes(...messages));
            return new Uint8Array(buffer);
        }
        else if (crypto.node) {
            const { createHash } = crypto.node;
            const hash = createHash('sha256');
            messages.forEach((m) => hash.update(m));
            return Uint8Array.from(hash.digest());
        }
        else {
            throw new Error("The environment doesn't have sha256 function");
        }
    },
    hmacSha256: async (key, ...messages) => {
        if (crypto.web) {
            const ckey = await crypto.web.subtle.importKey('raw', key, { name: 'HMAC', hash: { name: 'SHA-256' } }, false, ['sign']);
            const message = concatBytes(...messages);
            const buffer = await crypto.web.subtle.sign('HMAC', ckey, message);
            return new Uint8Array(buffer);
        }
        else if (crypto.node) {
            const { createHmac } = crypto.node;
            const hash = createHmac('sha256', key);
            messages.forEach((m) => hash.update(m));
            return Uint8Array.from(hash.digest());
        }
        else {
            throw new Error("The environment doesn't have hmac-sha256 function");
        }
    },
    sha256Sync: undefined,
    hmacSha256Sync: undefined,
    taggedHash: async (tag, ...messages) => {
        let tagP = TAGGED_HASH_PREFIXES[tag];
        if (tagP === undefined) {
            const tagH = await utils.sha256(Uint8Array.from(tag, (c) => c.charCodeAt(0)));
            tagP = concatBytes(tagH, tagH);
            TAGGED_HASH_PREFIXES[tag] = tagP;
        }
        return utils.sha256(tagP, ...messages);
    },
    taggedHashSync: (tag, ...messages) => {
        if (typeof _sha256Sync !== 'function')
            throw new ShaError('sha256Sync is undefined, you need to set it');
        let tagP = TAGGED_HASH_PREFIXES[tag];
        if (tagP === undefined) {
            const tagH = _sha256Sync(Uint8Array.from(tag, (c) => c.charCodeAt(0)));
            tagP = concatBytes(tagH, tagH);
            TAGGED_HASH_PREFIXES[tag] = tagP;
        }
        return _sha256Sync(tagP, ...messages);
    },
    _JacobianPoint: JacobianPoint,
};
Object.defineProperties(utils, {
    sha256Sync: {
        configurable: false,
        get() {
            return _sha256Sync;
        },
        set(val) {
            if (!_sha256Sync)
                _sha256Sync = val;
        },
    },
    hmacSha256Sync: {
        configurable: false,
        get() {
            return _hmacSha256Sync;
        },
        set(val) {
            if (!_hmacSha256Sync)
                _hmacSha256Sync = val;
        },
    },
});


/***/ }),

/***/ "./src/js/provider.js":
/*!****************************!*\
  !*** ./src/js/provider.js ***!
  \****************************/
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (/* binding */ Provider)
/* harmony export */ });
/* harmony import */ var ethers__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ethers */ "./node_modules/ethers/lib.esm/providers/default-provider.js");
/* harmony import */ var ethers__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ethers */ "./node_modules/ethers/lib.esm/providers/provider-browser.js");
function _typeof(obj) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (obj) { return typeof obj; } : function (obj) { return obj && "function" == typeof Symbol && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }, _typeof(obj); }
function _regeneratorRuntime() { "use strict"; /*! regenerator-runtime -- Copyright (c) 2014-present, Facebook, Inc. -- license (MIT): https://github.com/facebook/regenerator/blob/main/LICENSE */ _regeneratorRuntime = function _regeneratorRuntime() { return exports; }; var exports = {}, Op = Object.prototype, hasOwn = Op.hasOwnProperty, defineProperty = Object.defineProperty || function (obj, key, desc) { obj[key] = desc.value; }, $Symbol = "function" == typeof Symbol ? Symbol : {}, iteratorSymbol = $Symbol.iterator || "@@iterator", asyncIteratorSymbol = $Symbol.asyncIterator || "@@asyncIterator", toStringTagSymbol = $Symbol.toStringTag || "@@toStringTag"; function define(obj, key, value) { return Object.defineProperty(obj, key, { value: value, enumerable: !0, configurable: !0, writable: !0 }), obj[key]; } try { define({}, ""); } catch (err) { define = function define(obj, key, value) { return obj[key] = value; }; } function wrap(innerFn, outerFn, self, tryLocsList) { var protoGenerator = outerFn && outerFn.prototype instanceof Generator ? outerFn : Generator, generator = Object.create(protoGenerator.prototype), context = new Context(tryLocsList || []); return defineProperty(generator, "_invoke", { value: makeInvokeMethod(innerFn, self, context) }), generator; } function tryCatch(fn, obj, arg) { try { return { type: "normal", arg: fn.call(obj, arg) }; } catch (err) { return { type: "throw", arg: err }; } } exports.wrap = wrap; var ContinueSentinel = {}; function Generator() {} function GeneratorFunction() {} function GeneratorFunctionPrototype() {} var IteratorPrototype = {}; define(IteratorPrototype, iteratorSymbol, function () { return this; }); var getProto = Object.getPrototypeOf, NativeIteratorPrototype = getProto && getProto(getProto(values([]))); NativeIteratorPrototype && NativeIteratorPrototype !== Op && hasOwn.call(NativeIteratorPrototype, iteratorSymbol) && (IteratorPrototype = NativeIteratorPrototype); var Gp = GeneratorFunctionPrototype.prototype = Generator.prototype = Object.create(IteratorPrototype); function defineIteratorMethods(prototype) { ["next", "throw", "return"].forEach(function (method) { define(prototype, method, function (arg) { return this._invoke(method, arg); }); }); } function AsyncIterator(generator, PromiseImpl) { function invoke(method, arg, resolve, reject) { var record = tryCatch(generator[method], generator, arg); if ("throw" !== record.type) { var result = record.arg, value = result.value; return value && "object" == _typeof(value) && hasOwn.call(value, "__await") ? PromiseImpl.resolve(value.__await).then(function (value) { invoke("next", value, resolve, reject); }, function (err) { invoke("throw", err, resolve, reject); }) : PromiseImpl.resolve(value).then(function (unwrapped) { result.value = unwrapped, resolve(result); }, function (error) { return invoke("throw", error, resolve, reject); }); } reject(record.arg); } var previousPromise; defineProperty(this, "_invoke", { value: function value(method, arg) { function callInvokeWithMethodAndArg() { return new PromiseImpl(function (resolve, reject) { invoke(method, arg, resolve, reject); }); } return previousPromise = previousPromise ? previousPromise.then(callInvokeWithMethodAndArg, callInvokeWithMethodAndArg) : callInvokeWithMethodAndArg(); } }); } function makeInvokeMethod(innerFn, self, context) { var state = "suspendedStart"; return function (method, arg) { if ("executing" === state) throw new Error("Generator is already running"); if ("completed" === state) { if ("throw" === method) throw arg; return doneResult(); } for (context.method = method, context.arg = arg;;) { var delegate = context.delegate; if (delegate) { var delegateResult = maybeInvokeDelegate(delegate, context); if (delegateResult) { if (delegateResult === ContinueSentinel) continue; return delegateResult; } } if ("next" === context.method) context.sent = context._sent = context.arg;else if ("throw" === context.method) { if ("suspendedStart" === state) throw state = "completed", context.arg; context.dispatchException(context.arg); } else "return" === context.method && context.abrupt("return", context.arg); state = "executing"; var record = tryCatch(innerFn, self, context); if ("normal" === record.type) { if (state = context.done ? "completed" : "suspendedYield", record.arg === ContinueSentinel) continue; return { value: record.arg, done: context.done }; } "throw" === record.type && (state = "completed", context.method = "throw", context.arg = record.arg); } }; } function maybeInvokeDelegate(delegate, context) { var methodName = context.method, method = delegate.iterator[methodName]; if (undefined === method) return context.delegate = null, "throw" === methodName && delegate.iterator["return"] && (context.method = "return", context.arg = undefined, maybeInvokeDelegate(delegate, context), "throw" === context.method) || "return" !== methodName && (context.method = "throw", context.arg = new TypeError("The iterator does not provide a '" + methodName + "' method")), ContinueSentinel; var record = tryCatch(method, delegate.iterator, context.arg); if ("throw" === record.type) return context.method = "throw", context.arg = record.arg, context.delegate = null, ContinueSentinel; var info = record.arg; return info ? info.done ? (context[delegate.resultName] = info.value, context.next = delegate.nextLoc, "return" !== context.method && (context.method = "next", context.arg = undefined), context.delegate = null, ContinueSentinel) : info : (context.method = "throw", context.arg = new TypeError("iterator result is not an object"), context.delegate = null, ContinueSentinel); } function pushTryEntry(locs) { var entry = { tryLoc: locs[0] }; 1 in locs && (entry.catchLoc = locs[1]), 2 in locs && (entry.finallyLoc = locs[2], entry.afterLoc = locs[3]), this.tryEntries.push(entry); } function resetTryEntry(entry) { var record = entry.completion || {}; record.type = "normal", delete record.arg, entry.completion = record; } function Context(tryLocsList) { this.tryEntries = [{ tryLoc: "root" }], tryLocsList.forEach(pushTryEntry, this), this.reset(!0); } function values(iterable) { if (iterable) { var iteratorMethod = iterable[iteratorSymbol]; if (iteratorMethod) return iteratorMethod.call(iterable); if ("function" == typeof iterable.next) return iterable; if (!isNaN(iterable.length)) { var i = -1, next = function next() { for (; ++i < iterable.length;) if (hasOwn.call(iterable, i)) return next.value = iterable[i], next.done = !1, next; return next.value = undefined, next.done = !0, next; }; return next.next = next; } } return { next: doneResult }; } function doneResult() { return { value: undefined, done: !0 }; } return GeneratorFunction.prototype = GeneratorFunctionPrototype, defineProperty(Gp, "constructor", { value: GeneratorFunctionPrototype, configurable: !0 }), defineProperty(GeneratorFunctionPrototype, "constructor", { value: GeneratorFunction, configurable: !0 }), GeneratorFunction.displayName = define(GeneratorFunctionPrototype, toStringTagSymbol, "GeneratorFunction"), exports.isGeneratorFunction = function (genFun) { var ctor = "function" == typeof genFun && genFun.constructor; return !!ctor && (ctor === GeneratorFunction || "GeneratorFunction" === (ctor.displayName || ctor.name)); }, exports.mark = function (genFun) { return Object.setPrototypeOf ? Object.setPrototypeOf(genFun, GeneratorFunctionPrototype) : (genFun.__proto__ = GeneratorFunctionPrototype, define(genFun, toStringTagSymbol, "GeneratorFunction")), genFun.prototype = Object.create(Gp), genFun; }, exports.awrap = function (arg) { return { __await: arg }; }, defineIteratorMethods(AsyncIterator.prototype), define(AsyncIterator.prototype, asyncIteratorSymbol, function () { return this; }), exports.AsyncIterator = AsyncIterator, exports.async = function (innerFn, outerFn, self, tryLocsList, PromiseImpl) { void 0 === PromiseImpl && (PromiseImpl = Promise); var iter = new AsyncIterator(wrap(innerFn, outerFn, self, tryLocsList), PromiseImpl); return exports.isGeneratorFunction(outerFn) ? iter : iter.next().then(function (result) { return result.done ? result.value : iter.next(); }); }, defineIteratorMethods(Gp), define(Gp, toStringTagSymbol, "Generator"), define(Gp, iteratorSymbol, function () { return this; }), define(Gp, "toString", function () { return "[object Generator]"; }), exports.keys = function (val) { var object = Object(val), keys = []; for (var key in object) keys.push(key); return keys.reverse(), function next() { for (; keys.length;) { var key = keys.pop(); if (key in object) return next.value = key, next.done = !1, next; } return next.done = !0, next; }; }, exports.values = values, Context.prototype = { constructor: Context, reset: function reset(skipTempReset) { if (this.prev = 0, this.next = 0, this.sent = this._sent = undefined, this.done = !1, this.delegate = null, this.method = "next", this.arg = undefined, this.tryEntries.forEach(resetTryEntry), !skipTempReset) for (var name in this) "t" === name.charAt(0) && hasOwn.call(this, name) && !isNaN(+name.slice(1)) && (this[name] = undefined); }, stop: function stop() { this.done = !0; var rootRecord = this.tryEntries[0].completion; if ("throw" === rootRecord.type) throw rootRecord.arg; return this.rval; }, dispatchException: function dispatchException(exception) { if (this.done) throw exception; var context = this; function handle(loc, caught) { return record.type = "throw", record.arg = exception, context.next = loc, caught && (context.method = "next", context.arg = undefined), !!caught; } for (var i = this.tryEntries.length - 1; i >= 0; --i) { var entry = this.tryEntries[i], record = entry.completion; if ("root" === entry.tryLoc) return handle("end"); if (entry.tryLoc <= this.prev) { var hasCatch = hasOwn.call(entry, "catchLoc"), hasFinally = hasOwn.call(entry, "finallyLoc"); if (hasCatch && hasFinally) { if (this.prev < entry.catchLoc) return handle(entry.catchLoc, !0); if (this.prev < entry.finallyLoc) return handle(entry.finallyLoc); } else if (hasCatch) { if (this.prev < entry.catchLoc) return handle(entry.catchLoc, !0); } else { if (!hasFinally) throw new Error("try statement without catch or finally"); if (this.prev < entry.finallyLoc) return handle(entry.finallyLoc); } } } }, abrupt: function abrupt(type, arg) { for (var i = this.tryEntries.length - 1; i >= 0; --i) { var entry = this.tryEntries[i]; if (entry.tryLoc <= this.prev && hasOwn.call(entry, "finallyLoc") && this.prev < entry.finallyLoc) { var finallyEntry = entry; break; } } finallyEntry && ("break" === type || "continue" === type) && finallyEntry.tryLoc <= arg && arg <= finallyEntry.finallyLoc && (finallyEntry = null); var record = finallyEntry ? finallyEntry.completion : {}; return record.type = type, record.arg = arg, finallyEntry ? (this.method = "next", this.next = finallyEntry.finallyLoc, ContinueSentinel) : this.complete(record); }, complete: function complete(record, afterLoc) { if ("throw" === record.type) throw record.arg; return "break" === record.type || "continue" === record.type ? this.next = record.arg : "return" === record.type ? (this.rval = this.arg = record.arg, this.method = "return", this.next = "end") : "normal" === record.type && afterLoc && (this.next = afterLoc), ContinueSentinel; }, finish: function finish(finallyLoc) { for (var i = this.tryEntries.length - 1; i >= 0; --i) { var entry = this.tryEntries[i]; if (entry.finallyLoc === finallyLoc) return this.complete(entry.completion, entry.afterLoc), resetTryEntry(entry), ContinueSentinel; } }, "catch": function _catch(tryLoc) { for (var i = this.tryEntries.length - 1; i >= 0; --i) { var entry = this.tryEntries[i]; if (entry.tryLoc === tryLoc) { var record = entry.completion; if ("throw" === record.type) { var thrown = record.arg; resetTryEntry(entry); } return thrown; } } throw new Error("illegal catch attempt"); }, delegateYield: function delegateYield(iterable, resultName, nextLoc) { return this.delegate = { iterator: values(iterable), resultName: resultName, nextLoc: nextLoc }, "next" === this.method && (this.arg = undefined), ContinueSentinel; } }, exports; }
function asyncGeneratorStep(gen, resolve, reject, _next, _throw, key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { Promise.resolve(value).then(_next, _throw); } }
function _asyncToGenerator(fn) { return function () { var self = this, args = arguments; return new Promise(function (resolve, reject) { var gen = fn.apply(self, args); function _next(value) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "next", value); } function _throw(err) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "throw", err); } _next(undefined); }); }; }
function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }
function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, _toPropertyKey(descriptor.key), descriptor); } }
function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); Object.defineProperty(Constructor, "prototype", { writable: false }); return Constructor; }
function _toPropertyKey(arg) { var key = _toPrimitive(arg, "string"); return _typeof(key) === "symbol" ? key : String(key); }
function _toPrimitive(input, hint) { if (_typeof(input) !== "object" || input === null) return input; var prim = input[Symbol.toPrimitive]; if (prim !== undefined) { var res = prim.call(input, hint || "default"); if (_typeof(res) !== "object") return res; throw new TypeError("@@toPrimitive must return a primitive value."); } return (hint === "string" ? String : Number)(input); }
//const ethers = require('ethers');

var Provider = /*#__PURE__*/function () {
  function Provider() {
    _classCallCheck(this, Provider);
  }
  _createClass(Provider, [{
    key: "blockchainConnection",
    value: function () {
      var _blockchainConnection = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee() {
        var provider;
        return _regeneratorRuntime().wrap(function _callee$(_context) {
          while (1) switch (_context.prev = _context.next) {
            case 0:
              _context.prev = 0;
              if (window.ethereum === null) {
                // If MetaMask is not installed, we use the default provider,
                // which is backed by a variety of third-party services (such
                // as INFURA). They do not have private keys installed so are
                // only have read-only access
                console.log("MetaMask not installed; using read-only defaults");
                provider = ethers__WEBPACK_IMPORTED_MODULE_0__.getDefaultProvider();
              } else {
                // Connect to the MetaMask EIP-1193 object. This is a standard
                // protocol that allows Ethers access to make all read-only
                // requests through MetaMask.
                provider = new ethers__WEBPACK_IMPORTED_MODULE_1__.BrowserProvider(window.ethereum);
              }
              return _context.abrupt("return", provider);
            case 5:
              _context.prev = 5;
              _context.t0 = _context["catch"](0);
              console.log('Error in the network connection.');
              return _context.abrupt("return");
            case 9:
            case "end":
              return _context.stop();
          }
        }, _callee, null, [[0, 5]]);
      }));
      function blockchainConnection() {
        return _blockchainConnection.apply(this, arguments);
      }
      return blockchainConnection;
    }()
  }]);
  return Provider;
}();


/***/ }),

/***/ "./src/js/signer.js":
/*!**************************!*\
  !*** ./src/js/signer.js ***!
  \**************************/
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (/* binding */ Signer)
/* harmony export */ });
function _typeof(obj) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (obj) { return typeof obj; } : function (obj) { return obj && "function" == typeof Symbol && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }, _typeof(obj); }
function _regeneratorRuntime() { "use strict"; /*! regenerator-runtime -- Copyright (c) 2014-present, Facebook, Inc. -- license (MIT): https://github.com/facebook/regenerator/blob/main/LICENSE */ _regeneratorRuntime = function _regeneratorRuntime() { return exports; }; var exports = {}, Op = Object.prototype, hasOwn = Op.hasOwnProperty, defineProperty = Object.defineProperty || function (obj, key, desc) { obj[key] = desc.value; }, $Symbol = "function" == typeof Symbol ? Symbol : {}, iteratorSymbol = $Symbol.iterator || "@@iterator", asyncIteratorSymbol = $Symbol.asyncIterator || "@@asyncIterator", toStringTagSymbol = $Symbol.toStringTag || "@@toStringTag"; function define(obj, key, value) { return Object.defineProperty(obj, key, { value: value, enumerable: !0, configurable: !0, writable: !0 }), obj[key]; } try { define({}, ""); } catch (err) { define = function define(obj, key, value) { return obj[key] = value; }; } function wrap(innerFn, outerFn, self, tryLocsList) { var protoGenerator = outerFn && outerFn.prototype instanceof Generator ? outerFn : Generator, generator = Object.create(protoGenerator.prototype), context = new Context(tryLocsList || []); return defineProperty(generator, "_invoke", { value: makeInvokeMethod(innerFn, self, context) }), generator; } function tryCatch(fn, obj, arg) { try { return { type: "normal", arg: fn.call(obj, arg) }; } catch (err) { return { type: "throw", arg: err }; } } exports.wrap = wrap; var ContinueSentinel = {}; function Generator() {} function GeneratorFunction() {} function GeneratorFunctionPrototype() {} var IteratorPrototype = {}; define(IteratorPrototype, iteratorSymbol, function () { return this; }); var getProto = Object.getPrototypeOf, NativeIteratorPrototype = getProto && getProto(getProto(values([]))); NativeIteratorPrototype && NativeIteratorPrototype !== Op && hasOwn.call(NativeIteratorPrototype, iteratorSymbol) && (IteratorPrototype = NativeIteratorPrototype); var Gp = GeneratorFunctionPrototype.prototype = Generator.prototype = Object.create(IteratorPrototype); function defineIteratorMethods(prototype) { ["next", "throw", "return"].forEach(function (method) { define(prototype, method, function (arg) { return this._invoke(method, arg); }); }); } function AsyncIterator(generator, PromiseImpl) { function invoke(method, arg, resolve, reject) { var record = tryCatch(generator[method], generator, arg); if ("throw" !== record.type) { var result = record.arg, value = result.value; return value && "object" == _typeof(value) && hasOwn.call(value, "__await") ? PromiseImpl.resolve(value.__await).then(function (value) { invoke("next", value, resolve, reject); }, function (err) { invoke("throw", err, resolve, reject); }) : PromiseImpl.resolve(value).then(function (unwrapped) { result.value = unwrapped, resolve(result); }, function (error) { return invoke("throw", error, resolve, reject); }); } reject(record.arg); } var previousPromise; defineProperty(this, "_invoke", { value: function value(method, arg) { function callInvokeWithMethodAndArg() { return new PromiseImpl(function (resolve, reject) { invoke(method, arg, resolve, reject); }); } return previousPromise = previousPromise ? previousPromise.then(callInvokeWithMethodAndArg, callInvokeWithMethodAndArg) : callInvokeWithMethodAndArg(); } }); } function makeInvokeMethod(innerFn, self, context) { var state = "suspendedStart"; return function (method, arg) { if ("executing" === state) throw new Error("Generator is already running"); if ("completed" === state) { if ("throw" === method) throw arg; return doneResult(); } for (context.method = method, context.arg = arg;;) { var delegate = context.delegate; if (delegate) { var delegateResult = maybeInvokeDelegate(delegate, context); if (delegateResult) { if (delegateResult === ContinueSentinel) continue; return delegateResult; } } if ("next" === context.method) context.sent = context._sent = context.arg;else if ("throw" === context.method) { if ("suspendedStart" === state) throw state = "completed", context.arg; context.dispatchException(context.arg); } else "return" === context.method && context.abrupt("return", context.arg); state = "executing"; var record = tryCatch(innerFn, self, context); if ("normal" === record.type) { if (state = context.done ? "completed" : "suspendedYield", record.arg === ContinueSentinel) continue; return { value: record.arg, done: context.done }; } "throw" === record.type && (state = "completed", context.method = "throw", context.arg = record.arg); } }; } function maybeInvokeDelegate(delegate, context) { var methodName = context.method, method = delegate.iterator[methodName]; if (undefined === method) return context.delegate = null, "throw" === methodName && delegate.iterator["return"] && (context.method = "return", context.arg = undefined, maybeInvokeDelegate(delegate, context), "throw" === context.method) || "return" !== methodName && (context.method = "throw", context.arg = new TypeError("The iterator does not provide a '" + methodName + "' method")), ContinueSentinel; var record = tryCatch(method, delegate.iterator, context.arg); if ("throw" === record.type) return context.method = "throw", context.arg = record.arg, context.delegate = null, ContinueSentinel; var info = record.arg; return info ? info.done ? (context[delegate.resultName] = info.value, context.next = delegate.nextLoc, "return" !== context.method && (context.method = "next", context.arg = undefined), context.delegate = null, ContinueSentinel) : info : (context.method = "throw", context.arg = new TypeError("iterator result is not an object"), context.delegate = null, ContinueSentinel); } function pushTryEntry(locs) { var entry = { tryLoc: locs[0] }; 1 in locs && (entry.catchLoc = locs[1]), 2 in locs && (entry.finallyLoc = locs[2], entry.afterLoc = locs[3]), this.tryEntries.push(entry); } function resetTryEntry(entry) { var record = entry.completion || {}; record.type = "normal", delete record.arg, entry.completion = record; } function Context(tryLocsList) { this.tryEntries = [{ tryLoc: "root" }], tryLocsList.forEach(pushTryEntry, this), this.reset(!0); } function values(iterable) { if (iterable) { var iteratorMethod = iterable[iteratorSymbol]; if (iteratorMethod) return iteratorMethod.call(iterable); if ("function" == typeof iterable.next) return iterable; if (!isNaN(iterable.length)) { var i = -1, next = function next() { for (; ++i < iterable.length;) if (hasOwn.call(iterable, i)) return next.value = iterable[i], next.done = !1, next; return next.value = undefined, next.done = !0, next; }; return next.next = next; } } return { next: doneResult }; } function doneResult() { return { value: undefined, done: !0 }; } return GeneratorFunction.prototype = GeneratorFunctionPrototype, defineProperty(Gp, "constructor", { value: GeneratorFunctionPrototype, configurable: !0 }), defineProperty(GeneratorFunctionPrototype, "constructor", { value: GeneratorFunction, configurable: !0 }), GeneratorFunction.displayName = define(GeneratorFunctionPrototype, toStringTagSymbol, "GeneratorFunction"), exports.isGeneratorFunction = function (genFun) { var ctor = "function" == typeof genFun && genFun.constructor; return !!ctor && (ctor === GeneratorFunction || "GeneratorFunction" === (ctor.displayName || ctor.name)); }, exports.mark = function (genFun) { return Object.setPrototypeOf ? Object.setPrototypeOf(genFun, GeneratorFunctionPrototype) : (genFun.__proto__ = GeneratorFunctionPrototype, define(genFun, toStringTagSymbol, "GeneratorFunction")), genFun.prototype = Object.create(Gp), genFun; }, exports.awrap = function (arg) { return { __await: arg }; }, defineIteratorMethods(AsyncIterator.prototype), define(AsyncIterator.prototype, asyncIteratorSymbol, function () { return this; }), exports.AsyncIterator = AsyncIterator, exports.async = function (innerFn, outerFn, self, tryLocsList, PromiseImpl) { void 0 === PromiseImpl && (PromiseImpl = Promise); var iter = new AsyncIterator(wrap(innerFn, outerFn, self, tryLocsList), PromiseImpl); return exports.isGeneratorFunction(outerFn) ? iter : iter.next().then(function (result) { return result.done ? result.value : iter.next(); }); }, defineIteratorMethods(Gp), define(Gp, toStringTagSymbol, "Generator"), define(Gp, iteratorSymbol, function () { return this; }), define(Gp, "toString", function () { return "[object Generator]"; }), exports.keys = function (val) { var object = Object(val), keys = []; for (var key in object) keys.push(key); return keys.reverse(), function next() { for (; keys.length;) { var key = keys.pop(); if (key in object) return next.value = key, next.done = !1, next; } return next.done = !0, next; }; }, exports.values = values, Context.prototype = { constructor: Context, reset: function reset(skipTempReset) { if (this.prev = 0, this.next = 0, this.sent = this._sent = undefined, this.done = !1, this.delegate = null, this.method = "next", this.arg = undefined, this.tryEntries.forEach(resetTryEntry), !skipTempReset) for (var name in this) "t" === name.charAt(0) && hasOwn.call(this, name) && !isNaN(+name.slice(1)) && (this[name] = undefined); }, stop: function stop() { this.done = !0; var rootRecord = this.tryEntries[0].completion; if ("throw" === rootRecord.type) throw rootRecord.arg; return this.rval; }, dispatchException: function dispatchException(exception) { if (this.done) throw exception; var context = this; function handle(loc, caught) { return record.type = "throw", record.arg = exception, context.next = loc, caught && (context.method = "next", context.arg = undefined), !!caught; } for (var i = this.tryEntries.length - 1; i >= 0; --i) { var entry = this.tryEntries[i], record = entry.completion; if ("root" === entry.tryLoc) return handle("end"); if (entry.tryLoc <= this.prev) { var hasCatch = hasOwn.call(entry, "catchLoc"), hasFinally = hasOwn.call(entry, "finallyLoc"); if (hasCatch && hasFinally) { if (this.prev < entry.catchLoc) return handle(entry.catchLoc, !0); if (this.prev < entry.finallyLoc) return handle(entry.finallyLoc); } else if (hasCatch) { if (this.prev < entry.catchLoc) return handle(entry.catchLoc, !0); } else { if (!hasFinally) throw new Error("try statement without catch or finally"); if (this.prev < entry.finallyLoc) return handle(entry.finallyLoc); } } } }, abrupt: function abrupt(type, arg) { for (var i = this.tryEntries.length - 1; i >= 0; --i) { var entry = this.tryEntries[i]; if (entry.tryLoc <= this.prev && hasOwn.call(entry, "finallyLoc") && this.prev < entry.finallyLoc) { var finallyEntry = entry; break; } } finallyEntry && ("break" === type || "continue" === type) && finallyEntry.tryLoc <= arg && arg <= finallyEntry.finallyLoc && (finallyEntry = null); var record = finallyEntry ? finallyEntry.completion : {}; return record.type = type, record.arg = arg, finallyEntry ? (this.method = "next", this.next = finallyEntry.finallyLoc, ContinueSentinel) : this.complete(record); }, complete: function complete(record, afterLoc) { if ("throw" === record.type) throw record.arg; return "break" === record.type || "continue" === record.type ? this.next = record.arg : "return" === record.type ? (this.rval = this.arg = record.arg, this.method = "return", this.next = "end") : "normal" === record.type && afterLoc && (this.next = afterLoc), ContinueSentinel; }, finish: function finish(finallyLoc) { for (var i = this.tryEntries.length - 1; i >= 0; --i) { var entry = this.tryEntries[i]; if (entry.finallyLoc === finallyLoc) return this.complete(entry.completion, entry.afterLoc), resetTryEntry(entry), ContinueSentinel; } }, "catch": function _catch(tryLoc) { for (var i = this.tryEntries.length - 1; i >= 0; --i) { var entry = this.tryEntries[i]; if (entry.tryLoc === tryLoc) { var record = entry.completion; if ("throw" === record.type) { var thrown = record.arg; resetTryEntry(entry); } return thrown; } } throw new Error("illegal catch attempt"); }, delegateYield: function delegateYield(iterable, resultName, nextLoc) { return this.delegate = { iterator: values(iterable), resultName: resultName, nextLoc: nextLoc }, "next" === this.method && (this.arg = undefined), ContinueSentinel; } }, exports; }
function asyncGeneratorStep(gen, resolve, reject, _next, _throw, key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { Promise.resolve(value).then(_next, _throw); } }
function _asyncToGenerator(fn) { return function () { var self = this, args = arguments; return new Promise(function (resolve, reject) { var gen = fn.apply(self, args); function _next(value) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "next", value); } function _throw(err) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "throw", err); } _next(undefined); }); }; }
function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }
function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, _toPropertyKey(descriptor.key), descriptor); } }
function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); Object.defineProperty(Constructor, "prototype", { writable: false }); return Constructor; }
function _toPropertyKey(arg) { var key = _toPrimitive(arg, "string"); return _typeof(key) === "symbol" ? key : String(key); }
function _toPrimitive(input, hint) { if (_typeof(input) !== "object" || input === null) return input; var prim = input[Symbol.toPrimitive]; if (prim !== undefined) { var res = prim.call(input, hint || "default"); if (_typeof(res) !== "object") return res; throw new TypeError("@@toPrimitive must return a primitive value."); } return (hint === "string" ? String : Number)(input); }
var Signer = /*#__PURE__*/function () {
  function Signer() {
    _classCallCheck(this, Signer);
  }
  _createClass(Signer, [{
    key: "setSigner",
    value: function () {
      var _setSigner = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee(provider) {
        var signer;
        return _regeneratorRuntime().wrap(function _callee$(_context) {
          while (1) switch (_context.prev = _context.next) {
            case 0:
              _context.prev = 0;
              signer = null;
              if (!(window.ethereum !== null && provider)) {
                _context.next = 7;
                break;
              }
              _context.next = 5;
              return provider.getSigner();
            case 5:
              signer = _context.sent;
              return _context.abrupt("return", signer);
            case 7:
              _context.next = 13;
              break;
            case 9:
              _context.prev = 9;
              _context.t0 = _context["catch"](0);
              console.log('Connection with signer failed');
              return _context.abrupt("return");
            case 13:
            case "end":
              return _context.stop();
          }
        }, _callee, null, [[0, 9]]);
      }));
      function setSigner(_x) {
        return _setSigner.apply(this, arguments);
      }
      return setSigner;
    }()
  }]);
  return Signer;
}();


/***/ }),

/***/ "./src/js/transaction.js":
/*!*******************************!*\
  !*** ./src/js/transaction.js ***!
  \*******************************/
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (/* binding */ Transaction)
/* harmony export */ });
/* harmony import */ var ethers__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ethers */ "./node_modules/ethers/lib.esm/utils/units.js");
function _typeof(obj) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (obj) { return typeof obj; } : function (obj) { return obj && "function" == typeof Symbol && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }, _typeof(obj); }
function _regeneratorRuntime() { "use strict"; /*! regenerator-runtime -- Copyright (c) 2014-present, Facebook, Inc. -- license (MIT): https://github.com/facebook/regenerator/blob/main/LICENSE */ _regeneratorRuntime = function _regeneratorRuntime() { return exports; }; var exports = {}, Op = Object.prototype, hasOwn = Op.hasOwnProperty, defineProperty = Object.defineProperty || function (obj, key, desc) { obj[key] = desc.value; }, $Symbol = "function" == typeof Symbol ? Symbol : {}, iteratorSymbol = $Symbol.iterator || "@@iterator", asyncIteratorSymbol = $Symbol.asyncIterator || "@@asyncIterator", toStringTagSymbol = $Symbol.toStringTag || "@@toStringTag"; function define(obj, key, value) { return Object.defineProperty(obj, key, { value: value, enumerable: !0, configurable: !0, writable: !0 }), obj[key]; } try { define({}, ""); } catch (err) { define = function define(obj, key, value) { return obj[key] = value; }; } function wrap(innerFn, outerFn, self, tryLocsList) { var protoGenerator = outerFn && outerFn.prototype instanceof Generator ? outerFn : Generator, generator = Object.create(protoGenerator.prototype), context = new Context(tryLocsList || []); return defineProperty(generator, "_invoke", { value: makeInvokeMethod(innerFn, self, context) }), generator; } function tryCatch(fn, obj, arg) { try { return { type: "normal", arg: fn.call(obj, arg) }; } catch (err) { return { type: "throw", arg: err }; } } exports.wrap = wrap; var ContinueSentinel = {}; function Generator() {} function GeneratorFunction() {} function GeneratorFunctionPrototype() {} var IteratorPrototype = {}; define(IteratorPrototype, iteratorSymbol, function () { return this; }); var getProto = Object.getPrototypeOf, NativeIteratorPrototype = getProto && getProto(getProto(values([]))); NativeIteratorPrototype && NativeIteratorPrototype !== Op && hasOwn.call(NativeIteratorPrototype, iteratorSymbol) && (IteratorPrototype = NativeIteratorPrototype); var Gp = GeneratorFunctionPrototype.prototype = Generator.prototype = Object.create(IteratorPrototype); function defineIteratorMethods(prototype) { ["next", "throw", "return"].forEach(function (method) { define(prototype, method, function (arg) { return this._invoke(method, arg); }); }); } function AsyncIterator(generator, PromiseImpl) { function invoke(method, arg, resolve, reject) { var record = tryCatch(generator[method], generator, arg); if ("throw" !== record.type) { var result = record.arg, value = result.value; return value && "object" == _typeof(value) && hasOwn.call(value, "__await") ? PromiseImpl.resolve(value.__await).then(function (value) { invoke("next", value, resolve, reject); }, function (err) { invoke("throw", err, resolve, reject); }) : PromiseImpl.resolve(value).then(function (unwrapped) { result.value = unwrapped, resolve(result); }, function (error) { return invoke("throw", error, resolve, reject); }); } reject(record.arg); } var previousPromise; defineProperty(this, "_invoke", { value: function value(method, arg) { function callInvokeWithMethodAndArg() { return new PromiseImpl(function (resolve, reject) { invoke(method, arg, resolve, reject); }); } return previousPromise = previousPromise ? previousPromise.then(callInvokeWithMethodAndArg, callInvokeWithMethodAndArg) : callInvokeWithMethodAndArg(); } }); } function makeInvokeMethod(innerFn, self, context) { var state = "suspendedStart"; return function (method, arg) { if ("executing" === state) throw new Error("Generator is already running"); if ("completed" === state) { if ("throw" === method) throw arg; return doneResult(); } for (context.method = method, context.arg = arg;;) { var delegate = context.delegate; if (delegate) { var delegateResult = maybeInvokeDelegate(delegate, context); if (delegateResult) { if (delegateResult === ContinueSentinel) continue; return delegateResult; } } if ("next" === context.method) context.sent = context._sent = context.arg;else if ("throw" === context.method) { if ("suspendedStart" === state) throw state = "completed", context.arg; context.dispatchException(context.arg); } else "return" === context.method && context.abrupt("return", context.arg); state = "executing"; var record = tryCatch(innerFn, self, context); if ("normal" === record.type) { if (state = context.done ? "completed" : "suspendedYield", record.arg === ContinueSentinel) continue; return { value: record.arg, done: context.done }; } "throw" === record.type && (state = "completed", context.method = "throw", context.arg = record.arg); } }; } function maybeInvokeDelegate(delegate, context) { var methodName = context.method, method = delegate.iterator[methodName]; if (undefined === method) return context.delegate = null, "throw" === methodName && delegate.iterator["return"] && (context.method = "return", context.arg = undefined, maybeInvokeDelegate(delegate, context), "throw" === context.method) || "return" !== methodName && (context.method = "throw", context.arg = new TypeError("The iterator does not provide a '" + methodName + "' method")), ContinueSentinel; var record = tryCatch(method, delegate.iterator, context.arg); if ("throw" === record.type) return context.method = "throw", context.arg = record.arg, context.delegate = null, ContinueSentinel; var info = record.arg; return info ? info.done ? (context[delegate.resultName] = info.value, context.next = delegate.nextLoc, "return" !== context.method && (context.method = "next", context.arg = undefined), context.delegate = null, ContinueSentinel) : info : (context.method = "throw", context.arg = new TypeError("iterator result is not an object"), context.delegate = null, ContinueSentinel); } function pushTryEntry(locs) { var entry = { tryLoc: locs[0] }; 1 in locs && (entry.catchLoc = locs[1]), 2 in locs && (entry.finallyLoc = locs[2], entry.afterLoc = locs[3]), this.tryEntries.push(entry); } function resetTryEntry(entry) { var record = entry.completion || {}; record.type = "normal", delete record.arg, entry.completion = record; } function Context(tryLocsList) { this.tryEntries = [{ tryLoc: "root" }], tryLocsList.forEach(pushTryEntry, this), this.reset(!0); } function values(iterable) { if (iterable) { var iteratorMethod = iterable[iteratorSymbol]; if (iteratorMethod) return iteratorMethod.call(iterable); if ("function" == typeof iterable.next) return iterable; if (!isNaN(iterable.length)) { var i = -1, next = function next() { for (; ++i < iterable.length;) if (hasOwn.call(iterable, i)) return next.value = iterable[i], next.done = !1, next; return next.value = undefined, next.done = !0, next; }; return next.next = next; } } return { next: doneResult }; } function doneResult() { return { value: undefined, done: !0 }; } return GeneratorFunction.prototype = GeneratorFunctionPrototype, defineProperty(Gp, "constructor", { value: GeneratorFunctionPrototype, configurable: !0 }), defineProperty(GeneratorFunctionPrototype, "constructor", { value: GeneratorFunction, configurable: !0 }), GeneratorFunction.displayName = define(GeneratorFunctionPrototype, toStringTagSymbol, "GeneratorFunction"), exports.isGeneratorFunction = function (genFun) { var ctor = "function" == typeof genFun && genFun.constructor; return !!ctor && (ctor === GeneratorFunction || "GeneratorFunction" === (ctor.displayName || ctor.name)); }, exports.mark = function (genFun) { return Object.setPrototypeOf ? Object.setPrototypeOf(genFun, GeneratorFunctionPrototype) : (genFun.__proto__ = GeneratorFunctionPrototype, define(genFun, toStringTagSymbol, "GeneratorFunction")), genFun.prototype = Object.create(Gp), genFun; }, exports.awrap = function (arg) { return { __await: arg }; }, defineIteratorMethods(AsyncIterator.prototype), define(AsyncIterator.prototype, asyncIteratorSymbol, function () { return this; }), exports.AsyncIterator = AsyncIterator, exports.async = function (innerFn, outerFn, self, tryLocsList, PromiseImpl) { void 0 === PromiseImpl && (PromiseImpl = Promise); var iter = new AsyncIterator(wrap(innerFn, outerFn, self, tryLocsList), PromiseImpl); return exports.isGeneratorFunction(outerFn) ? iter : iter.next().then(function (result) { return result.done ? result.value : iter.next(); }); }, defineIteratorMethods(Gp), define(Gp, toStringTagSymbol, "Generator"), define(Gp, iteratorSymbol, function () { return this; }), define(Gp, "toString", function () { return "[object Generator]"; }), exports.keys = function (val) { var object = Object(val), keys = []; for (var key in object) keys.push(key); return keys.reverse(), function next() { for (; keys.length;) { var key = keys.pop(); if (key in object) return next.value = key, next.done = !1, next; } return next.done = !0, next; }; }, exports.values = values, Context.prototype = { constructor: Context, reset: function reset(skipTempReset) { if (this.prev = 0, this.next = 0, this.sent = this._sent = undefined, this.done = !1, this.delegate = null, this.method = "next", this.arg = undefined, this.tryEntries.forEach(resetTryEntry), !skipTempReset) for (var name in this) "t" === name.charAt(0) && hasOwn.call(this, name) && !isNaN(+name.slice(1)) && (this[name] = undefined); }, stop: function stop() { this.done = !0; var rootRecord = this.tryEntries[0].completion; if ("throw" === rootRecord.type) throw rootRecord.arg; return this.rval; }, dispatchException: function dispatchException(exception) { if (this.done) throw exception; var context = this; function handle(loc, caught) { return record.type = "throw", record.arg = exception, context.next = loc, caught && (context.method = "next", context.arg = undefined), !!caught; } for (var i = this.tryEntries.length - 1; i >= 0; --i) { var entry = this.tryEntries[i], record = entry.completion; if ("root" === entry.tryLoc) return handle("end"); if (entry.tryLoc <= this.prev) { var hasCatch = hasOwn.call(entry, "catchLoc"), hasFinally = hasOwn.call(entry, "finallyLoc"); if (hasCatch && hasFinally) { if (this.prev < entry.catchLoc) return handle(entry.catchLoc, !0); if (this.prev < entry.finallyLoc) return handle(entry.finallyLoc); } else if (hasCatch) { if (this.prev < entry.catchLoc) return handle(entry.catchLoc, !0); } else { if (!hasFinally) throw new Error("try statement without catch or finally"); if (this.prev < entry.finallyLoc) return handle(entry.finallyLoc); } } } }, abrupt: function abrupt(type, arg) { for (var i = this.tryEntries.length - 1; i >= 0; --i) { var entry = this.tryEntries[i]; if (entry.tryLoc <= this.prev && hasOwn.call(entry, "finallyLoc") && this.prev < entry.finallyLoc) { var finallyEntry = entry; break; } } finallyEntry && ("break" === type || "continue" === type) && finallyEntry.tryLoc <= arg && arg <= finallyEntry.finallyLoc && (finallyEntry = null); var record = finallyEntry ? finallyEntry.completion : {}; return record.type = type, record.arg = arg, finallyEntry ? (this.method = "next", this.next = finallyEntry.finallyLoc, ContinueSentinel) : this.complete(record); }, complete: function complete(record, afterLoc) { if ("throw" === record.type) throw record.arg; return "break" === record.type || "continue" === record.type ? this.next = record.arg : "return" === record.type ? (this.rval = this.arg = record.arg, this.method = "return", this.next = "end") : "normal" === record.type && afterLoc && (this.next = afterLoc), ContinueSentinel; }, finish: function finish(finallyLoc) { for (var i = this.tryEntries.length - 1; i >= 0; --i) { var entry = this.tryEntries[i]; if (entry.finallyLoc === finallyLoc) return this.complete(entry.completion, entry.afterLoc), resetTryEntry(entry), ContinueSentinel; } }, "catch": function _catch(tryLoc) { for (var i = this.tryEntries.length - 1; i >= 0; --i) { var entry = this.tryEntries[i]; if (entry.tryLoc === tryLoc) { var record = entry.completion; if ("throw" === record.type) { var thrown = record.arg; resetTryEntry(entry); } return thrown; } } throw new Error("illegal catch attempt"); }, delegateYield: function delegateYield(iterable, resultName, nextLoc) { return this.delegate = { iterator: values(iterable), resultName: resultName, nextLoc: nextLoc }, "next" === this.method && (this.arg = undefined), ContinueSentinel; } }, exports; }
function asyncGeneratorStep(gen, resolve, reject, _next, _throw, key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { Promise.resolve(value).then(_next, _throw); } }
function _asyncToGenerator(fn) { return function () { var self = this, args = arguments; return new Promise(function (resolve, reject) { var gen = fn.apply(self, args); function _next(value) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "next", value); } function _throw(err) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "throw", err); } _next(undefined); }); }; }
function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }
function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, _toPropertyKey(descriptor.key), descriptor); } }
function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); Object.defineProperty(Constructor, "prototype", { writable: false }); return Constructor; }
function _toPropertyKey(arg) { var key = _toPrimitive(arg, "string"); return _typeof(key) === "symbol" ? key : String(key); }
function _toPrimitive(input, hint) { if (_typeof(input) !== "object" || input === null) return input; var prim = input[Symbol.toPrimitive]; if (prim !== undefined) { var res = prim.call(input, hint || "default"); if (_typeof(res) !== "object") return res; throw new TypeError("@@toPrimitive must return a primitive value."); } return (hint === "string" ? String : Number)(input); }

var Transaction = /*#__PURE__*/function () {
  function Transaction(signer, walletAddressTo, value) {
    _classCallCheck(this, Transaction);
    this.signer = signer;
    this.walletAddressTo = walletAddressTo;
    this.value = value;
  }

  // send a transaction
  _createClass(Transaction, [{
    key: "createTransaction",
    value: function () {
      var _createTransaction = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee() {
        var tx;
        return _regeneratorRuntime().wrap(function _callee$(_context) {
          while (1) switch (_context.prev = _context.next) {
            case 0:
              _context.next = 2;
              return this.signer.sendTransaction({
                to: this.walletAddressTo,
                value: ethers__WEBPACK_IMPORTED_MODULE_0__.parseEther(this.value)
              });
            case 2:
              tx = _context.sent;
              return _context.abrupt("return", tx);
            case 4:
            case "end":
              return _context.stop();
          }
        }, _callee, this);
      }));
      function createTransaction() {
        return _createTransaction.apply(this, arguments);
      }
      return createTransaction;
    }()
  }]);
  return Transaction;
}();


/***/ }),

/***/ "./src/js/validateFormData.js":
/*!************************************!*\
  !*** ./src/js/validateFormData.js ***!
  \************************************/
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (/* binding */ ValidateFormData)
/* harmony export */ });
/* harmony import */ var ethers__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ethers */ "./node_modules/ethers/lib.esm/address/checks.js");
function _typeof(obj) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (obj) { return typeof obj; } : function (obj) { return obj && "function" == typeof Symbol && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }, _typeof(obj); }
function _regeneratorRuntime() { "use strict"; /*! regenerator-runtime -- Copyright (c) 2014-present, Facebook, Inc. -- license (MIT): https://github.com/facebook/regenerator/blob/main/LICENSE */ _regeneratorRuntime = function _regeneratorRuntime() { return exports; }; var exports = {}, Op = Object.prototype, hasOwn = Op.hasOwnProperty, defineProperty = Object.defineProperty || function (obj, key, desc) { obj[key] = desc.value; }, $Symbol = "function" == typeof Symbol ? Symbol : {}, iteratorSymbol = $Symbol.iterator || "@@iterator", asyncIteratorSymbol = $Symbol.asyncIterator || "@@asyncIterator", toStringTagSymbol = $Symbol.toStringTag || "@@toStringTag"; function define(obj, key, value) { return Object.defineProperty(obj, key, { value: value, enumerable: !0, configurable: !0, writable: !0 }), obj[key]; } try { define({}, ""); } catch (err) { define = function define(obj, key, value) { return obj[key] = value; }; } function wrap(innerFn, outerFn, self, tryLocsList) { var protoGenerator = outerFn && outerFn.prototype instanceof Generator ? outerFn : Generator, generator = Object.create(protoGenerator.prototype), context = new Context(tryLocsList || []); return defineProperty(generator, "_invoke", { value: makeInvokeMethod(innerFn, self, context) }), generator; } function tryCatch(fn, obj, arg) { try { return { type: "normal", arg: fn.call(obj, arg) }; } catch (err) { return { type: "throw", arg: err }; } } exports.wrap = wrap; var ContinueSentinel = {}; function Generator() {} function GeneratorFunction() {} function GeneratorFunctionPrototype() {} var IteratorPrototype = {}; define(IteratorPrototype, iteratorSymbol, function () { return this; }); var getProto = Object.getPrototypeOf, NativeIteratorPrototype = getProto && getProto(getProto(values([]))); NativeIteratorPrototype && NativeIteratorPrototype !== Op && hasOwn.call(NativeIteratorPrototype, iteratorSymbol) && (IteratorPrototype = NativeIteratorPrototype); var Gp = GeneratorFunctionPrototype.prototype = Generator.prototype = Object.create(IteratorPrototype); function defineIteratorMethods(prototype) { ["next", "throw", "return"].forEach(function (method) { define(prototype, method, function (arg) { return this._invoke(method, arg); }); }); } function AsyncIterator(generator, PromiseImpl) { function invoke(method, arg, resolve, reject) { var record = tryCatch(generator[method], generator, arg); if ("throw" !== record.type) { var result = record.arg, value = result.value; return value && "object" == _typeof(value) && hasOwn.call(value, "__await") ? PromiseImpl.resolve(value.__await).then(function (value) { invoke("next", value, resolve, reject); }, function (err) { invoke("throw", err, resolve, reject); }) : PromiseImpl.resolve(value).then(function (unwrapped) { result.value = unwrapped, resolve(result); }, function (error) { return invoke("throw", error, resolve, reject); }); } reject(record.arg); } var previousPromise; defineProperty(this, "_invoke", { value: function value(method, arg) { function callInvokeWithMethodAndArg() { return new PromiseImpl(function (resolve, reject) { invoke(method, arg, resolve, reject); }); } return previousPromise = previousPromise ? previousPromise.then(callInvokeWithMethodAndArg, callInvokeWithMethodAndArg) : callInvokeWithMethodAndArg(); } }); } function makeInvokeMethod(innerFn, self, context) { var state = "suspendedStart"; return function (method, arg) { if ("executing" === state) throw new Error("Generator is already running"); if ("completed" === state) { if ("throw" === method) throw arg; return doneResult(); } for (context.method = method, context.arg = arg;;) { var delegate = context.delegate; if (delegate) { var delegateResult = maybeInvokeDelegate(delegate, context); if (delegateResult) { if (delegateResult === ContinueSentinel) continue; return delegateResult; } } if ("next" === context.method) context.sent = context._sent = context.arg;else if ("throw" === context.method) { if ("suspendedStart" === state) throw state = "completed", context.arg; context.dispatchException(context.arg); } else "return" === context.method && context.abrupt("return", context.arg); state = "executing"; var record = tryCatch(innerFn, self, context); if ("normal" === record.type) { if (state = context.done ? "completed" : "suspendedYield", record.arg === ContinueSentinel) continue; return { value: record.arg, done: context.done }; } "throw" === record.type && (state = "completed", context.method = "throw", context.arg = record.arg); } }; } function maybeInvokeDelegate(delegate, context) { var methodName = context.method, method = delegate.iterator[methodName]; if (undefined === method) return context.delegate = null, "throw" === methodName && delegate.iterator["return"] && (context.method = "return", context.arg = undefined, maybeInvokeDelegate(delegate, context), "throw" === context.method) || "return" !== methodName && (context.method = "throw", context.arg = new TypeError("The iterator does not provide a '" + methodName + "' method")), ContinueSentinel; var record = tryCatch(method, delegate.iterator, context.arg); if ("throw" === record.type) return context.method = "throw", context.arg = record.arg, context.delegate = null, ContinueSentinel; var info = record.arg; return info ? info.done ? (context[delegate.resultName] = info.value, context.next = delegate.nextLoc, "return" !== context.method && (context.method = "next", context.arg = undefined), context.delegate = null, ContinueSentinel) : info : (context.method = "throw", context.arg = new TypeError("iterator result is not an object"), context.delegate = null, ContinueSentinel); } function pushTryEntry(locs) { var entry = { tryLoc: locs[0] }; 1 in locs && (entry.catchLoc = locs[1]), 2 in locs && (entry.finallyLoc = locs[2], entry.afterLoc = locs[3]), this.tryEntries.push(entry); } function resetTryEntry(entry) { var record = entry.completion || {}; record.type = "normal", delete record.arg, entry.completion = record; } function Context(tryLocsList) { this.tryEntries = [{ tryLoc: "root" }], tryLocsList.forEach(pushTryEntry, this), this.reset(!0); } function values(iterable) { if (iterable) { var iteratorMethod = iterable[iteratorSymbol]; if (iteratorMethod) return iteratorMethod.call(iterable); if ("function" == typeof iterable.next) return iterable; if (!isNaN(iterable.length)) { var i = -1, next = function next() { for (; ++i < iterable.length;) if (hasOwn.call(iterable, i)) return next.value = iterable[i], next.done = !1, next; return next.value = undefined, next.done = !0, next; }; return next.next = next; } } return { next: doneResult }; } function doneResult() { return { value: undefined, done: !0 }; } return GeneratorFunction.prototype = GeneratorFunctionPrototype, defineProperty(Gp, "constructor", { value: GeneratorFunctionPrototype, configurable: !0 }), defineProperty(GeneratorFunctionPrototype, "constructor", { value: GeneratorFunction, configurable: !0 }), GeneratorFunction.displayName = define(GeneratorFunctionPrototype, toStringTagSymbol, "GeneratorFunction"), exports.isGeneratorFunction = function (genFun) { var ctor = "function" == typeof genFun && genFun.constructor; return !!ctor && (ctor === GeneratorFunction || "GeneratorFunction" === (ctor.displayName || ctor.name)); }, exports.mark = function (genFun) { return Object.setPrototypeOf ? Object.setPrototypeOf(genFun, GeneratorFunctionPrototype) : (genFun.__proto__ = GeneratorFunctionPrototype, define(genFun, toStringTagSymbol, "GeneratorFunction")), genFun.prototype = Object.create(Gp), genFun; }, exports.awrap = function (arg) { return { __await: arg }; }, defineIteratorMethods(AsyncIterator.prototype), define(AsyncIterator.prototype, asyncIteratorSymbol, function () { return this; }), exports.AsyncIterator = AsyncIterator, exports.async = function (innerFn, outerFn, self, tryLocsList, PromiseImpl) { void 0 === PromiseImpl && (PromiseImpl = Promise); var iter = new AsyncIterator(wrap(innerFn, outerFn, self, tryLocsList), PromiseImpl); return exports.isGeneratorFunction(outerFn) ? iter : iter.next().then(function (result) { return result.done ? result.value : iter.next(); }); }, defineIteratorMethods(Gp), define(Gp, toStringTagSymbol, "Generator"), define(Gp, iteratorSymbol, function () { return this; }), define(Gp, "toString", function () { return "[object Generator]"; }), exports.keys = function (val) { var object = Object(val), keys = []; for (var key in object) keys.push(key); return keys.reverse(), function next() { for (; keys.length;) { var key = keys.pop(); if (key in object) return next.value = key, next.done = !1, next; } return next.done = !0, next; }; }, exports.values = values, Context.prototype = { constructor: Context, reset: function reset(skipTempReset) { if (this.prev = 0, this.next = 0, this.sent = this._sent = undefined, this.done = !1, this.delegate = null, this.method = "next", this.arg = undefined, this.tryEntries.forEach(resetTryEntry), !skipTempReset) for (var name in this) "t" === name.charAt(0) && hasOwn.call(this, name) && !isNaN(+name.slice(1)) && (this[name] = undefined); }, stop: function stop() { this.done = !0; var rootRecord = this.tryEntries[0].completion; if ("throw" === rootRecord.type) throw rootRecord.arg; return this.rval; }, dispatchException: function dispatchException(exception) { if (this.done) throw exception; var context = this; function handle(loc, caught) { return record.type = "throw", record.arg = exception, context.next = loc, caught && (context.method = "next", context.arg = undefined), !!caught; } for (var i = this.tryEntries.length - 1; i >= 0; --i) { var entry = this.tryEntries[i], record = entry.completion; if ("root" === entry.tryLoc) return handle("end"); if (entry.tryLoc <= this.prev) { var hasCatch = hasOwn.call(entry, "catchLoc"), hasFinally = hasOwn.call(entry, "finallyLoc"); if (hasCatch && hasFinally) { if (this.prev < entry.catchLoc) return handle(entry.catchLoc, !0); if (this.prev < entry.finallyLoc) return handle(entry.finallyLoc); } else if (hasCatch) { if (this.prev < entry.catchLoc) return handle(entry.catchLoc, !0); } else { if (!hasFinally) throw new Error("try statement without catch or finally"); if (this.prev < entry.finallyLoc) return handle(entry.finallyLoc); } } } }, abrupt: function abrupt(type, arg) { for (var i = this.tryEntries.length - 1; i >= 0; --i) { var entry = this.tryEntries[i]; if (entry.tryLoc <= this.prev && hasOwn.call(entry, "finallyLoc") && this.prev < entry.finallyLoc) { var finallyEntry = entry; break; } } finallyEntry && ("break" === type || "continue" === type) && finallyEntry.tryLoc <= arg && arg <= finallyEntry.finallyLoc && (finallyEntry = null); var record = finallyEntry ? finallyEntry.completion : {}; return record.type = type, record.arg = arg, finallyEntry ? (this.method = "next", this.next = finallyEntry.finallyLoc, ContinueSentinel) : this.complete(record); }, complete: function complete(record, afterLoc) { if ("throw" === record.type) throw record.arg; return "break" === record.type || "continue" === record.type ? this.next = record.arg : "return" === record.type ? (this.rval = this.arg = record.arg, this.method = "return", this.next = "end") : "normal" === record.type && afterLoc && (this.next = afterLoc), ContinueSentinel; }, finish: function finish(finallyLoc) { for (var i = this.tryEntries.length - 1; i >= 0; --i) { var entry = this.tryEntries[i]; if (entry.finallyLoc === finallyLoc) return this.complete(entry.completion, entry.afterLoc), resetTryEntry(entry), ContinueSentinel; } }, "catch": function _catch(tryLoc) { for (var i = this.tryEntries.length - 1; i >= 0; --i) { var entry = this.tryEntries[i]; if (entry.tryLoc === tryLoc) { var record = entry.completion; if ("throw" === record.type) { var thrown = record.arg; resetTryEntry(entry); } return thrown; } } throw new Error("illegal catch attempt"); }, delegateYield: function delegateYield(iterable, resultName, nextLoc) { return this.delegate = { iterator: values(iterable), resultName: resultName, nextLoc: nextLoc }, "next" === this.method && (this.arg = undefined), ContinueSentinel; } }, exports; }
function asyncGeneratorStep(gen, resolve, reject, _next, _throw, key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { Promise.resolve(value).then(_next, _throw); } }
function _asyncToGenerator(fn) { return function () { var self = this, args = arguments; return new Promise(function (resolve, reject) { var gen = fn.apply(self, args); function _next(value) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "next", value); } function _throw(err) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "throw", err); } _next(undefined); }); }; }
function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }
function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, _toPropertyKey(descriptor.key), descriptor); } }
function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); Object.defineProperty(Constructor, "prototype", { writable: false }); return Constructor; }
function _toPropertyKey(arg) { var key = _toPrimitive(arg, "string"); return _typeof(key) === "symbol" ? key : String(key); }
function _toPrimitive(input, hint) { if (_typeof(input) !== "object" || input === null) return input; var prim = input[Symbol.toPrimitive]; if (prim !== undefined) { var res = prim.call(input, hint || "default"); if (_typeof(res) !== "object") return res; throw new TypeError("@@toPrimitive must return a primitive value."); } return (hint === "string" ? String : Number)(input); }

var ValidateFormData = /*#__PURE__*/function () {
  function ValidateFormData(toWalletAddress, amount) {
    _classCallCheck(this, ValidateFormData);
    this.toWalletAddress = toWalletAddress;
    this.amount = amount;
  }

  // validate data from form
  _createClass(ValidateFormData, [{
    key: "validateData",
    value: function () {
      var _validateData = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee() {
        return _regeneratorRuntime().wrap(function _callee$(_context) {
          while (1) switch (_context.prev = _context.next) {
            case 0:
              if (!(ethers__WEBPACK_IMPORTED_MODULE_0__.isAddress(this.toWalletAddress) && Number(this.amount) && Number(this.amount > 0))) {
                _context.next = 2;
                break;
              }
              return _context.abrupt("return", true);
            case 2:
              return _context.abrupt("return", false);
            case 3:
            case "end":
              return _context.stop();
          }
        }, _callee, this);
      }));
      function validateData() {
        return _validateData.apply(this, arguments);
      }
      return validateData;
    }()
  }]);
  return ValidateFormData;
}();


/***/ }),

/***/ "./node_modules/ethers/lib.esm/_version.js":
/*!*************************************************!*\
  !*** ./node_modules/ethers/lib.esm/_version.js ***!
  \*************************************************/
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "version": () => (/* binding */ version)
/* harmony export */ });
/* Do NOT modify this file; see /src.ts/_admin/update-version.ts */
/**
 *  The current version of Ethers.
 */
const version = "6.0.8";
//# sourceMappingURL=_version.js.map

/***/ }),

/***/ "./node_modules/ethers/lib.esm/abi/abi-coder.js":
/*!******************************************************!*\
  !*** ./node_modules/ethers/lib.esm/abi/abi-coder.js ***!
  \******************************************************/
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "AbiCoder": () => (/* binding */ AbiCoder)
/* harmony export */ });
/* harmony import */ var _utils_index_js__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ../utils/index.js */ "./node_modules/ethers/lib.esm/utils/errors.js");
/* harmony import */ var _coders_abstract_coder_js__WEBPACK_IMPORTED_MODULE_13__ = __webpack_require__(/*! ./coders/abstract-coder.js */ "./node_modules/ethers/lib.esm/abi/coders/abstract-coder.js");
/* harmony import */ var _coders_address_js__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! ./coders/address.js */ "./node_modules/ethers/lib.esm/abi/coders/address.js");
/* harmony import */ var _coders_array_js__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./coders/array.js */ "./node_modules/ethers/lib.esm/abi/coders/array.js");
/* harmony import */ var _coders_boolean_js__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! ./coders/boolean.js */ "./node_modules/ethers/lib.esm/abi/coders/boolean.js");
/* harmony import */ var _coders_bytes_js__WEBPACK_IMPORTED_MODULE_8__ = __webpack_require__(/*! ./coders/bytes.js */ "./node_modules/ethers/lib.esm/abi/coders/bytes.js");
/* harmony import */ var _coders_fixed_bytes_js__WEBPACK_IMPORTED_MODULE_11__ = __webpack_require__(/*! ./coders/fixed-bytes.js */ "./node_modules/ethers/lib.esm/abi/coders/fixed-bytes.js");
/* harmony import */ var _coders_null_js__WEBPACK_IMPORTED_MODULE_9__ = __webpack_require__(/*! ./coders/null.js */ "./node_modules/ethers/lib.esm/abi/coders/null.js");
/* harmony import */ var _coders_number_js__WEBPACK_IMPORTED_MODULE_10__ = __webpack_require__(/*! ./coders/number.js */ "./node_modules/ethers/lib.esm/abi/coders/number.js");
/* harmony import */ var _coders_string_js__WEBPACK_IMPORTED_MODULE_7__ = __webpack_require__(/*! ./coders/string.js */ "./node_modules/ethers/lib.esm/abi/coders/string.js");
/* harmony import */ var _coders_tuple_js__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ./coders/tuple.js */ "./node_modules/ethers/lib.esm/abi/coders/tuple.js");
/* harmony import */ var _fragments_js__WEBPACK_IMPORTED_MODULE_12__ = __webpack_require__(/*! ./fragments.js */ "./node_modules/ethers/lib.esm/abi/fragments.js");
/* harmony import */ var _address_index_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../address/index.js */ "./node_modules/ethers/lib.esm/address/address.js");
/* harmony import */ var _utils_index_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../utils/index.js */ "./node_modules/ethers/lib.esm/utils/data.js");
/**
 *  When sending values to or receiving values from a [[Contract]], the
 *  data is generally encoded using the [ABI standard](solc-abi-standard).
 *
 *  The AbiCoder provides a utility to encode values to ABI data and
 *  decode values from ABI data.
 *
 *  Most of the time, developers should favour the [[Contract]] class,
 *  which further abstracts a lot of the finer details of ABI data.
 *
 *  @_section api/abi/abi-coder:ABI Encoding
 */
// See: https://github.com/ethereum/wiki/wiki/Ethereum-Contract-ABI














// https://docs.soliditylang.org/en/v0.8.17/control-structures.html
const PanicReasons = new Map();
PanicReasons.set(0x00, "GENERIC_PANIC");
PanicReasons.set(0x01, "ASSERT_FALSE");
PanicReasons.set(0x11, "OVERFLOW");
PanicReasons.set(0x12, "DIVIDE_BY_ZERO");
PanicReasons.set(0x21, "ENUM_RANGE_ERROR");
PanicReasons.set(0x22, "BAD_STORAGE_DATA");
PanicReasons.set(0x31, "STACK_UNDERFLOW");
PanicReasons.set(0x32, "ARRAY_RANGE_ERROR");
PanicReasons.set(0x41, "OUT_OF_MEMORY");
PanicReasons.set(0x51, "UNINITIALIZED_FUNCTION_CALL");
const paramTypeBytes = new RegExp(/^bytes([0-9]*)$/);
const paramTypeNumber = new RegExp(/^(u?int)([0-9]*)$/);
let defaultCoder = null;
function getBuiltinCallException(action, tx, data, abiCoder) {
    let message = "missing revert data";
    let reason = null;
    const invocation = null;
    let revert = null;
    if (data) {
        message = "execution reverted";
        const bytes = (0,_utils_index_js__WEBPACK_IMPORTED_MODULE_0__.getBytes)(data);
        data = (0,_utils_index_js__WEBPACK_IMPORTED_MODULE_0__.hexlify)(data);
        if (bytes.length === 0) {
            message += " (no data present; likely require(false) occurred";
            reason = "require(false)";
        }
        else if (bytes.length % 32 !== 4) {
            message += " (could not decode reason; invalid data length)";
        }
        else if ((0,_utils_index_js__WEBPACK_IMPORTED_MODULE_0__.hexlify)(bytes.slice(0, 4)) === "0x08c379a0") {
            // Error(string)
            try {
                reason = abiCoder.decode(["string"], bytes.slice(4))[0];
                revert = {
                    signature: "Error(string)",
                    name: "Error",
                    args: [reason]
                };
                message += `: ${JSON.stringify(reason)}`;
            }
            catch (error) {
                message += " (could not decode reason; invalid string data)";
            }
        }
        else if ((0,_utils_index_js__WEBPACK_IMPORTED_MODULE_0__.hexlify)(bytes.slice(0, 4)) === "0x4e487b71") {
            // Panic(uint256)
            try {
                const code = Number(abiCoder.decode(["uint256"], bytes.slice(4))[0]);
                revert = {
                    signature: "Panic(uint256)",
                    name: "Panic",
                    args: [code]
                };
                reason = `Panic due to ${PanicReasons.get(code) || "UNKNOWN"}(${code})`;
                message += `: ${reason}`;
            }
            catch (error) {
                message += " (could not decode panic code)";
            }
        }
        else {
            message += " (unknown custom error)";
        }
    }
    const transaction = {
        to: (tx.to ? (0,_address_index_js__WEBPACK_IMPORTED_MODULE_1__.getAddress)(tx.to) : null),
        data: (tx.data || "0x")
    };
    if (tx.from) {
        transaction.from = (0,_address_index_js__WEBPACK_IMPORTED_MODULE_1__.getAddress)(tx.from);
    }
    return (0,_utils_index_js__WEBPACK_IMPORTED_MODULE_2__.makeError)(message, "CALL_EXCEPTION", {
        action, data, reason, transaction, invocation, revert
    });
}
/**
  * About AbiCoder
  */
class AbiCoder {
    #getCoder(param) {
        if (param.isArray()) {
            return new _coders_array_js__WEBPACK_IMPORTED_MODULE_3__.ArrayCoder(this.#getCoder(param.arrayChildren), param.arrayLength, param.name);
        }
        if (param.isTuple()) {
            return new _coders_tuple_js__WEBPACK_IMPORTED_MODULE_4__.TupleCoder(param.components.map((c) => this.#getCoder(c)), param.name);
        }
        switch (param.baseType) {
            case "address":
                return new _coders_address_js__WEBPACK_IMPORTED_MODULE_5__.AddressCoder(param.name);
            case "bool":
                return new _coders_boolean_js__WEBPACK_IMPORTED_MODULE_6__.BooleanCoder(param.name);
            case "string":
                return new _coders_string_js__WEBPACK_IMPORTED_MODULE_7__.StringCoder(param.name);
            case "bytes":
                return new _coders_bytes_js__WEBPACK_IMPORTED_MODULE_8__.BytesCoder(param.name);
            case "":
                return new _coders_null_js__WEBPACK_IMPORTED_MODULE_9__.NullCoder(param.name);
        }
        // u?int[0-9]*
        let match = param.type.match(paramTypeNumber);
        if (match) {
            let size = parseInt(match[2] || "256");
            (0,_utils_index_js__WEBPACK_IMPORTED_MODULE_2__.assertArgument)(size !== 0 && size <= 256 && (size % 8) === 0, "invalid " + match[1] + " bit length", "param", param);
            return new _coders_number_js__WEBPACK_IMPORTED_MODULE_10__.NumberCoder(size / 8, (match[1] === "int"), param.name);
        }
        // bytes[0-9]+
        match = param.type.match(paramTypeBytes);
        if (match) {
            let size = parseInt(match[1]);
            (0,_utils_index_js__WEBPACK_IMPORTED_MODULE_2__.assertArgument)(size !== 0 && size <= 32, "invalid bytes length", "param", param);
            return new _coders_fixed_bytes_js__WEBPACK_IMPORTED_MODULE_11__.FixedBytesCoder(size, param.name);
        }
        (0,_utils_index_js__WEBPACK_IMPORTED_MODULE_2__.assertArgument)(false, "invalid type", "type", param.type);
    }
    /**
     *  Get the default values for the given %%types%%.
     *
     *  For example, a ``uint`` is by default ``0`` and ``bool``
     *  is by default ``false``.
     */
    getDefaultValue(types) {
        const coders = types.map((type) => this.#getCoder(_fragments_js__WEBPACK_IMPORTED_MODULE_12__.ParamType.from(type)));
        const coder = new _coders_tuple_js__WEBPACK_IMPORTED_MODULE_4__.TupleCoder(coders, "_");
        return coder.defaultValue();
    }
    /**
     *  Encode the %%values%% as the %%types%% into ABI data.
     *
     *  @returns DataHexstring
     */
    encode(types, values) {
        (0,_utils_index_js__WEBPACK_IMPORTED_MODULE_2__.assertArgumentCount)(values.length, types.length, "types/values length mismatch");
        const coders = types.map((type) => this.#getCoder(_fragments_js__WEBPACK_IMPORTED_MODULE_12__.ParamType.from(type)));
        const coder = (new _coders_tuple_js__WEBPACK_IMPORTED_MODULE_4__.TupleCoder(coders, "_"));
        const writer = new _coders_abstract_coder_js__WEBPACK_IMPORTED_MODULE_13__.Writer();
        coder.encode(writer, values);
        return writer.data;
    }
    /**
     *  Decode the ABI %%data%% as the %%types%% into values.
     *
     *  If %%loose%% decoding is enabled, then strict padding is
     *  not enforced. Some older versions of Solidity incorrectly
     *  padded event data emitted from ``external`` functions.
     */
    decode(types, data, loose) {
        const coders = types.map((type) => this.#getCoder(_fragments_js__WEBPACK_IMPORTED_MODULE_12__.ParamType.from(type)));
        const coder = new _coders_tuple_js__WEBPACK_IMPORTED_MODULE_4__.TupleCoder(coders, "_");
        return coder.decode(new _coders_abstract_coder_js__WEBPACK_IMPORTED_MODULE_13__.Reader(data, loose));
    }
    /**
     *  Returns the shared singleton instance of a default [[AbiCoder]].
     *
     *  On the first call, the instance is created internally.
     */
    static defaultAbiCoder() {
        if (defaultCoder == null) {
            defaultCoder = new AbiCoder();
        }
        return defaultCoder;
    }
    /**
     *  Returns an ethers-compatible [[CallExceptionError]] Error for the given
     *  result %%data%% for the [[CallExceptionAction]] %%action%% against
     *  the Transaction %%tx%%.
     */
    static getBuiltinCallException(action, tx, data) {
        return getBuiltinCallException(action, tx, data, AbiCoder.defaultAbiCoder());
    }
}
//# sourceMappingURL=abi-coder.js.map

/***/ }),

/***/ "./node_modules/ethers/lib.esm/abi/coders/abstract-coder.js":
/*!******************************************************************!*\
  !*** ./node_modules/ethers/lib.esm/abi/coders/abstract-coder.js ***!
  \******************************************************************/
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "Coder": () => (/* binding */ Coder),
/* harmony export */   "Reader": () => (/* binding */ Reader),
/* harmony export */   "Result": () => (/* binding */ Result),
/* harmony export */   "WordSize": () => (/* binding */ WordSize),
/* harmony export */   "Writer": () => (/* binding */ Writer),
/* harmony export */   "checkResultErrors": () => (/* binding */ checkResultErrors)
/* harmony export */ });
/* harmony import */ var _utils_index_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../../utils/index.js */ "./node_modules/ethers/lib.esm/utils/maths.js");
/* harmony import */ var _utils_index_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../../utils/index.js */ "./node_modules/ethers/lib.esm/utils/errors.js");
/* harmony import */ var _utils_index_js__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ../../utils/index.js */ "./node_modules/ethers/lib.esm/utils/data.js");
/* harmony import */ var _utils_index_js__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ../../utils/index.js */ "./node_modules/ethers/lib.esm/utils/properties.js");

/**
 * @_ignore:
 */
const WordSize = 32;
const Padding = new Uint8Array(WordSize);
// Properties used to immediate pass through to the underlying object
// - `then` is used to detect if an object is a Promise for await
const passProperties = ["then"];
const _guard = {};
function throwError(name, error) {
    const wrapped = new Error(`deferred error during ABI decoding triggered accessing ${name}`);
    wrapped.error = error;
    throw wrapped;
}
/**
 *  A [[Result]] is a sub-class of Array, which allows accessing any
 *  of its values either positionally by its index or, if keys are
 *  provided by its name.
 *
 *  @_docloc: api/abi
 */
class Result extends Array {
    #names;
    /**
     *  @private
     */
    constructor(...args) {
        // To properly sub-class Array so the other built-in
        // functions work, the constructor has to behave fairly
        // well. So, in the event we are created via fromItems()
        // we build the read-only Result object we want, but on
        // any other input, we use the default constructor
        // constructor(guard: any, items: Array<any>, keys?: Array<null | string>);
        const guard = args[0];
        let items = args[1];
        let names = (args[2] || []).slice();
        let wrap = true;
        if (guard !== _guard) {
            items = args;
            names = [];
            wrap = false;
        }
        // Can't just pass in ...items since an array of length 1
        // is a special case in the super.
        super(items.length);
        items.forEach((item, index) => { this[index] = item; });
        // Find all unique keys
        const nameCounts = names.reduce((accum, name) => {
            if (typeof (name) === "string") {
                accum.set(name, (accum.get(name) || 0) + 1);
            }
            return accum;
        }, (new Map()));
        // Remove any key thats not unique
        this.#names = Object.freeze(items.map((item, index) => {
            const name = names[index];
            if (name != null && nameCounts.get(name) === 1) {
                return name;
            }
            return null;
        }));
        if (!wrap) {
            return;
        }
        // A wrapped Result is immutable
        Object.freeze(this);
        // Proxy indices and names so we can trap deferred errors
        return new Proxy(this, {
            get: (target, prop, receiver) => {
                if (typeof (prop) === "string") {
                    // Index accessor
                    if (prop.match(/^[0-9]+$/)) {
                        const index = (0,_utils_index_js__WEBPACK_IMPORTED_MODULE_0__.getNumber)(prop, "%index");
                        if (index < 0 || index >= this.length) {
                            throw new RangeError("out of result range");
                        }
                        const item = target[index];
                        if (item instanceof Error) {
                            throwError(`index ${index}`, item);
                        }
                        return item;
                    }
                    // Pass important checks (like `then` for Promise) through
                    if (passProperties.indexOf(prop) >= 0) {
                        return Reflect.get(target, prop, receiver);
                    }
                    const value = target[prop];
                    if (value instanceof Function) {
                        // Make sure functions work with private variables
                        // See: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Proxy#no_private_property_forwarding
                        return function (...args) {
                            return value.apply((this === receiver) ? target : this, args);
                        };
                    }
                    else if (!(prop in target)) {
                        // Possible name accessor
                        return target.getValue.apply((this === receiver) ? target : this, [prop]);
                    }
                }
                return Reflect.get(target, prop, receiver);
            }
        });
    }
    /**
     *  Returns the Result as a normal Array.
     *
     *  This will throw if there are any outstanding deferred
     *  errors.
     */
    toArray() {
        const result = [];
        this.forEach((item, index) => {
            if (item instanceof Error) {
                throwError(`index ${index}`, item);
            }
            result.push(item);
        });
        return result;
    }
    /**
     *  Returns the Result as an Object with each name-value pair.
     *
     *  This will throw if any value is unnamed, or if there are
     *  any outstanding deferred errors.
     */
    toObject() {
        return this.#names.reduce((accum, name, index) => {
            (0,_utils_index_js__WEBPACK_IMPORTED_MODULE_1__.assert)(name != null, "value at index ${ index } unnamed", "UNSUPPORTED_OPERATION", {
                operation: "toObject()"
            });
            // Add values for names that don't conflict
            if (!(name in accum)) {
                accum[name] = this.getValue(name);
            }
            return accum;
        }, {});
    }
    /**
     *  @_ignore
     */
    slice(start, end) {
        if (start == null) {
            start = 0;
        }
        if (start < 0) {
            start += this.length;
            if (start < 0) {
                start = 0;
            }
        }
        if (end == null) {
            end = this.length;
        }
        if (end < 0) {
            end += this.length;
            if (end < 0) {
                end = 0;
            }
        }
        if (end > this.length) {
            end = this.length;
        }
        const result = [], names = [];
        for (let i = start; i < end; i++) {
            result.push(this[i]);
            names.push(this.#names[i]);
        }
        return new Result(_guard, result, names);
    }
    /**
     *  @_ignore
     */
    filter(callback, thisArg) {
        const result = [], names = [];
        for (let i = 0; i < this.length; i++) {
            const item = this[i];
            if (item instanceof Error) {
                throwError(`index ${i}`, item);
            }
            if (callback.call(thisArg, item, i, this)) {
                result.push(item);
                names.push(this.#names[i]);
            }
        }
        return new Result(_guard, result, names);
    }
    /**
     *  Returns the value for %%name%%.
     *
     *  Since it is possible to have a key whose name conflicts with
     *  a method on a [[Result]] or its superclass Array, or any
     *  JavaScript keyword, this ensures all named values are still
     *  accessible by name.
     */
    getValue(name) {
        const index = this.#names.indexOf(name);
        if (index === -1) {
            return undefined;
        }
        const value = this[index];
        if (value instanceof Error) {
            throwError(`property ${JSON.stringify(name)}`, value.error);
        }
        return value;
    }
    /**
     *  Creates a new [[Result]] for %%items%% with each entry
     *  also accessible by its corresponding name in %%keys%%.
     */
    static fromItems(items, keys) {
        return new Result(_guard, items, keys);
    }
}
/**
 *  Returns all errors found in a [[Result]].
 *
 *  Since certain errors encountered when creating a [[Result]] do
 *  not impact the ability to continue parsing data, they are
 *  deferred until they are actually accessed. Hence a faulty string
 *  in an Event that is never used does not impact the program flow.
 *
 *  However, sometimes it may be useful to access, identify or
 *  validate correctness of a [[Result]].
 *
 *  @_docloc api/abi
 */
function checkResultErrors(result) {
    // Find the first error (if any)
    const errors = [];
    const checkErrors = function (path, object) {
        if (!Array.isArray(object)) {
            return;
        }
        for (let key in object) {
            const childPath = path.slice();
            childPath.push(key);
            try {
                checkErrors(childPath, object[key]);
            }
            catch (error) {
                errors.push({ path: childPath, error: error });
            }
        }
    };
    checkErrors([], result);
    return errors;
}
function getValue(value) {
    let bytes = (0,_utils_index_js__WEBPACK_IMPORTED_MODULE_0__.toBeArray)(value);
    (0,_utils_index_js__WEBPACK_IMPORTED_MODULE_1__.assert)(bytes.length <= WordSize, "value out-of-bounds", "BUFFER_OVERRUN", { buffer: bytes, length: WordSize, offset: bytes.length });
    if (bytes.length !== WordSize) {
        bytes = (0,_utils_index_js__WEBPACK_IMPORTED_MODULE_2__.getBytesCopy)((0,_utils_index_js__WEBPACK_IMPORTED_MODULE_2__.concat)([Padding.slice(bytes.length % WordSize), bytes]));
    }
    return bytes;
}
/**
 *  @_ignore
 */
class Coder {
    // The coder name:
    //   - address, uint256, tuple, array, etc.
    name;
    // The fully expanded type, including composite types:
    //   - address, uint256, tuple(address,bytes), uint256[3][4][],  etc.
    type;
    // The localName bound in the signature, in this example it is "baz":
    //   - tuple(address foo, uint bar) baz
    localName;
    // Whether this type is dynamic:
    //  - Dynamic: bytes, string, address[], tuple(boolean[]), etc.
    //  - Not Dynamic: address, uint256, boolean[3], tuple(address, uint8)
    dynamic;
    constructor(name, type, localName, dynamic) {
        (0,_utils_index_js__WEBPACK_IMPORTED_MODULE_3__.defineProperties)(this, { name, type, localName, dynamic }, {
            name: "string", type: "string", localName: "string", dynamic: "boolean"
        });
    }
    _throwError(message, value) {
        (0,_utils_index_js__WEBPACK_IMPORTED_MODULE_1__.assertArgument)(false, message, this.localName, value);
    }
}
/**
 *  @_ignore
 */
class Writer {
    // An array of WordSize lengthed objects to concatenation
    #data;
    #dataLength;
    constructor() {
        this.#data = [];
        this.#dataLength = 0;
    }
    get data() {
        return (0,_utils_index_js__WEBPACK_IMPORTED_MODULE_2__.concat)(this.#data);
    }
    get length() { return this.#dataLength; }
    #writeData(data) {
        this.#data.push(data);
        this.#dataLength += data.length;
        return data.length;
    }
    appendWriter(writer) {
        return this.#writeData((0,_utils_index_js__WEBPACK_IMPORTED_MODULE_2__.getBytesCopy)(writer.data));
    }
    // Arrayish item; pad on the right to *nearest* WordSize
    writeBytes(value) {
        let bytes = (0,_utils_index_js__WEBPACK_IMPORTED_MODULE_2__.getBytesCopy)(value);
        const paddingOffset = bytes.length % WordSize;
        if (paddingOffset) {
            bytes = (0,_utils_index_js__WEBPACK_IMPORTED_MODULE_2__.getBytesCopy)((0,_utils_index_js__WEBPACK_IMPORTED_MODULE_2__.concat)([bytes, Padding.slice(paddingOffset)]));
        }
        return this.#writeData(bytes);
    }
    // Numeric item; pad on the left *to* WordSize
    writeValue(value) {
        return this.#writeData(getValue(value));
    }
    // Inserts a numeric place-holder, returning a callback that can
    // be used to asjust the value later
    writeUpdatableValue() {
        const offset = this.#data.length;
        this.#data.push(Padding);
        this.#dataLength += WordSize;
        return (value) => {
            this.#data[offset] = getValue(value);
        };
    }
}
/**
 *  @_ignore
 */
class Reader {
    // Allows incomplete unpadded data to be read; otherwise an error
    // is raised if attempting to overrun the buffer. This is required
    // to deal with an old Solidity bug, in which event data for
    // external (not public thoguh) was tightly packed.
    allowLoose;
    #data;
    #offset;
    constructor(data, allowLoose) {
        (0,_utils_index_js__WEBPACK_IMPORTED_MODULE_3__.defineProperties)(this, { allowLoose: !!allowLoose });
        this.#data = (0,_utils_index_js__WEBPACK_IMPORTED_MODULE_2__.getBytesCopy)(data);
        this.#offset = 0;
    }
    get data() { return (0,_utils_index_js__WEBPACK_IMPORTED_MODULE_2__.hexlify)(this.#data); }
    get dataLength() { return this.#data.length; }
    get consumed() { return this.#offset; }
    get bytes() { return new Uint8Array(this.#data); }
    #peekBytes(offset, length, loose) {
        let alignedLength = Math.ceil(length / WordSize) * WordSize;
        if (this.#offset + alignedLength > this.#data.length) {
            if (this.allowLoose && loose && this.#offset + length <= this.#data.length) {
                alignedLength = length;
            }
            else {
                (0,_utils_index_js__WEBPACK_IMPORTED_MODULE_1__.assert)(false, "data out-of-bounds", "BUFFER_OVERRUN", {
                    buffer: (0,_utils_index_js__WEBPACK_IMPORTED_MODULE_2__.getBytesCopy)(this.#data),
                    length: this.#data.length,
                    offset: this.#offset + alignedLength
                });
            }
        }
        return this.#data.slice(this.#offset, this.#offset + alignedLength);
    }
    // Create a sub-reader with the same underlying data, but offset
    subReader(offset) {
        return new Reader(this.#data.slice(this.#offset + offset), this.allowLoose);
    }
    // Read bytes
    readBytes(length, loose) {
        let bytes = this.#peekBytes(0, length, !!loose);
        this.#offset += bytes.length;
        // @TODO: Make sure the length..end bytes are all 0?
        return bytes.slice(0, length);
    }
    // Read a numeric values
    readValue() {
        return (0,_utils_index_js__WEBPACK_IMPORTED_MODULE_0__.toBigInt)(this.readBytes(WordSize));
    }
    readIndex() {
        return (0,_utils_index_js__WEBPACK_IMPORTED_MODULE_0__.toNumber)(this.readBytes(WordSize));
    }
}
//# sourceMappingURL=abstract-coder.js.map

/***/ }),

/***/ "./node_modules/ethers/lib.esm/abi/coders/address.js":
/*!***********************************************************!*\
  !*** ./node_modules/ethers/lib.esm/abi/coders/address.js ***!
  \***********************************************************/
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "AddressCoder": () => (/* binding */ AddressCoder)
/* harmony export */ });
/* harmony import */ var _address_index_js__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ../../address/index.js */ "./node_modules/ethers/lib.esm/address/address.js");
/* harmony import */ var _utils_maths_js__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ../../utils/maths.js */ "./node_modules/ethers/lib.esm/utils/maths.js");
/* harmony import */ var _typed_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../typed.js */ "./node_modules/ethers/lib.esm/abi/typed.js");
/* harmony import */ var _abstract_coder_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./abstract-coder.js */ "./node_modules/ethers/lib.esm/abi/coders/abstract-coder.js");




/**
 *  @_ignore
 */
class AddressCoder extends _abstract_coder_js__WEBPACK_IMPORTED_MODULE_0__.Coder {
    constructor(localName) {
        super("address", "address", localName, false);
    }
    defaultValue() {
        return "0x0000000000000000000000000000000000000000";
    }
    encode(writer, _value) {
        let value = _typed_js__WEBPACK_IMPORTED_MODULE_1__.Typed.dereference(_value, "string");
        try {
            value = (0,_address_index_js__WEBPACK_IMPORTED_MODULE_2__.getAddress)(value);
        }
        catch (error) {
            return this._throwError(error.message, _value);
        }
        return writer.writeValue(value);
    }
    decode(reader) {
        return (0,_address_index_js__WEBPACK_IMPORTED_MODULE_2__.getAddress)((0,_utils_maths_js__WEBPACK_IMPORTED_MODULE_3__.toBeHex)(reader.readValue(), 20));
    }
}
//# sourceMappingURL=address.js.map

/***/ }),

/***/ "./node_modules/ethers/lib.esm/abi/coders/anonymous.js":
/*!*************************************************************!*\
  !*** ./node_modules/ethers/lib.esm/abi/coders/anonymous.js ***!
  \*************************************************************/
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "AnonymousCoder": () => (/* binding */ AnonymousCoder)
/* harmony export */ });
/* harmony import */ var _abstract_coder_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./abstract-coder.js */ "./node_modules/ethers/lib.esm/abi/coders/abstract-coder.js");

/**
 *  Clones the functionality of an existing Coder, but without a localName
 *
 *  @_ignore
 */
class AnonymousCoder extends _abstract_coder_js__WEBPACK_IMPORTED_MODULE_0__.Coder {
    coder;
    constructor(coder) {
        super(coder.name, coder.type, "_", coder.dynamic);
        this.coder = coder;
    }
    defaultValue() {
        return this.coder.defaultValue();
    }
    encode(writer, value) {
        return this.coder.encode(writer, value);
    }
    decode(reader) {
        return this.coder.decode(reader);
    }
}
//# sourceMappingURL=anonymous.js.map

/***/ }),

/***/ "./node_modules/ethers/lib.esm/abi/coders/array.js":
/*!*********************************************************!*\
  !*** ./node_modules/ethers/lib.esm/abi/coders/array.js ***!
  \*********************************************************/
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "ArrayCoder": () => (/* binding */ ArrayCoder),
/* harmony export */   "pack": () => (/* binding */ pack),
/* harmony export */   "unpack": () => (/* binding */ unpack)
/* harmony export */ });
/* harmony import */ var _utils_index_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../../utils/index.js */ "./node_modules/ethers/lib.esm/utils/errors.js");
/* harmony import */ var _utils_index_js__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ../../utils/index.js */ "./node_modules/ethers/lib.esm/utils/properties.js");
/* harmony import */ var _typed_js__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ../typed.js */ "./node_modules/ethers/lib.esm/abi/typed.js");
/* harmony import */ var _abstract_coder_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./abstract-coder.js */ "./node_modules/ethers/lib.esm/abi/coders/abstract-coder.js");
/* harmony import */ var _anonymous_js__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ./anonymous.js */ "./node_modules/ethers/lib.esm/abi/coders/anonymous.js");




/**
 *  @_ignore
 */
function pack(writer, coders, values) {
    let arrayValues = [];
    if (Array.isArray(values)) {
        arrayValues = values;
    }
    else if (values && typeof (values) === "object") {
        let unique = {};
        arrayValues = coders.map((coder) => {
            const name = coder.localName;
            (0,_utils_index_js__WEBPACK_IMPORTED_MODULE_0__.assert)(name, "cannot encode object for signature with missing names", "INVALID_ARGUMENT", { argument: "values", info: { coder }, value: values });
            (0,_utils_index_js__WEBPACK_IMPORTED_MODULE_0__.assert)(!unique[name], "cannot encode object for signature with duplicate names", "INVALID_ARGUMENT", { argument: "values", info: { coder }, value: values });
            unique[name] = true;
            return values[name];
        });
    }
    else {
        (0,_utils_index_js__WEBPACK_IMPORTED_MODULE_0__.assertArgument)(false, "invalid tuple value", "tuple", values);
    }
    (0,_utils_index_js__WEBPACK_IMPORTED_MODULE_0__.assertArgument)(coders.length === arrayValues.length, "types/value length mismatch", "tuple", values);
    let staticWriter = new _abstract_coder_js__WEBPACK_IMPORTED_MODULE_1__.Writer();
    let dynamicWriter = new _abstract_coder_js__WEBPACK_IMPORTED_MODULE_1__.Writer();
    let updateFuncs = [];
    coders.forEach((coder, index) => {
        let value = arrayValues[index];
        if (coder.dynamic) {
            // Get current dynamic offset (for the future pointer)
            let dynamicOffset = dynamicWriter.length;
            // Encode the dynamic value into the dynamicWriter
            coder.encode(dynamicWriter, value);
            // Prepare to populate the correct offset once we are done
            let updateFunc = staticWriter.writeUpdatableValue();
            updateFuncs.push((baseOffset) => {
                updateFunc(baseOffset + dynamicOffset);
            });
        }
        else {
            coder.encode(staticWriter, value);
        }
    });
    // Backfill all the dynamic offsets, now that we know the static length
    updateFuncs.forEach((func) => { func(staticWriter.length); });
    let length = writer.appendWriter(staticWriter);
    length += writer.appendWriter(dynamicWriter);
    return length;
}
/**
 *  @_ignore
 */
function unpack(reader, coders) {
    let values = [];
    let keys = [];
    // A reader anchored to this base
    let baseReader = reader.subReader(0);
    coders.forEach((coder) => {
        let value = null;
        if (coder.dynamic) {
            let offset = reader.readIndex();
            let offsetReader = baseReader.subReader(offset);
            try {
                value = coder.decode(offsetReader);
            }
            catch (error) {
                // Cannot recover from this
                if ((0,_utils_index_js__WEBPACK_IMPORTED_MODULE_0__.isError)(error, "BUFFER_OVERRUN")) {
                    throw error;
                }
                value = error;
                value.baseType = coder.name;
                value.name = coder.localName;
                value.type = coder.type;
            }
        }
        else {
            try {
                value = coder.decode(reader);
            }
            catch (error) {
                // Cannot recover from this
                if ((0,_utils_index_js__WEBPACK_IMPORTED_MODULE_0__.isError)(error, "BUFFER_OVERRUN")) {
                    throw error;
                }
                value = error;
                value.baseType = coder.name;
                value.name = coder.localName;
                value.type = coder.type;
            }
        }
        if (value == undefined) {
            throw new Error("investigate");
        }
        values.push(value);
        keys.push(coder.localName || null);
    });
    return _abstract_coder_js__WEBPACK_IMPORTED_MODULE_1__.Result.fromItems(values, keys);
}
/**
 *  @_ignore
 */
class ArrayCoder extends _abstract_coder_js__WEBPACK_IMPORTED_MODULE_1__.Coder {
    coder;
    length;
    constructor(coder, length, localName) {
        const type = (coder.type + "[" + (length >= 0 ? length : "") + "]");
        const dynamic = (length === -1 || coder.dynamic);
        super("array", type, localName, dynamic);
        (0,_utils_index_js__WEBPACK_IMPORTED_MODULE_2__.defineProperties)(this, { coder, length });
    }
    defaultValue() {
        // Verifies the child coder is valid (even if the array is dynamic or 0-length)
        const defaultChild = this.coder.defaultValue();
        const result = [];
        for (let i = 0; i < this.length; i++) {
            result.push(defaultChild);
        }
        return result;
    }
    encode(writer, _value) {
        const value = _typed_js__WEBPACK_IMPORTED_MODULE_3__.Typed.dereference(_value, "array");
        if (!Array.isArray(value)) {
            this._throwError("expected array value", value);
        }
        let count = this.length;
        if (count === -1) {
            count = value.length;
            writer.writeValue(value.length);
        }
        (0,_utils_index_js__WEBPACK_IMPORTED_MODULE_0__.assertArgumentCount)(value.length, count, "coder array" + (this.localName ? (" " + this.localName) : ""));
        let coders = [];
        for (let i = 0; i < value.length; i++) {
            coders.push(this.coder);
        }
        return pack(writer, coders, value);
    }
    decode(reader) {
        let count = this.length;
        if (count === -1) {
            count = reader.readIndex();
            // Check that there is *roughly* enough data to ensure
            // stray random data is not being read as a length. Each
            // slot requires at least 32 bytes for their value (or 32
            // bytes as a link to the data). This could use a much
            // tighter bound, but we are erroring on the side of safety.
            (0,_utils_index_js__WEBPACK_IMPORTED_MODULE_0__.assert)(count * _abstract_coder_js__WEBPACK_IMPORTED_MODULE_1__.WordSize <= reader.dataLength, "insufficient data length", "BUFFER_OVERRUN", { buffer: reader.bytes, offset: count * _abstract_coder_js__WEBPACK_IMPORTED_MODULE_1__.WordSize, length: reader.dataLength });
        }
        let coders = [];
        for (let i = 0; i < count; i++) {
            coders.push(new _anonymous_js__WEBPACK_IMPORTED_MODULE_4__.AnonymousCoder(this.coder));
        }
        return unpack(reader, coders);
    }
}
//# sourceMappingURL=array.js.map

/***/ }),

/***/ "./node_modules/ethers/lib.esm/abi/coders/boolean.js":
/*!***********************************************************!*\
  !*** ./node_modules/ethers/lib.esm/abi/coders/boolean.js ***!
  \***********************************************************/
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "BooleanCoder": () => (/* binding */ BooleanCoder)
/* harmony export */ });
/* harmony import */ var _typed_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../typed.js */ "./node_modules/ethers/lib.esm/abi/typed.js");
/* harmony import */ var _abstract_coder_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./abstract-coder.js */ "./node_modules/ethers/lib.esm/abi/coders/abstract-coder.js");


/**
 *  @_ignore
 */
class BooleanCoder extends _abstract_coder_js__WEBPACK_IMPORTED_MODULE_0__.Coder {
    constructor(localName) {
        super("bool", "bool", localName, false);
    }
    defaultValue() {
        return false;
    }
    encode(writer, _value) {
        const value = _typed_js__WEBPACK_IMPORTED_MODULE_1__.Typed.dereference(_value, "bool");
        return writer.writeValue(value ? 1 : 0);
    }
    decode(reader) {
        return !!reader.readValue();
    }
}
//# sourceMappingURL=boolean.js.map

/***/ }),

/***/ "./node_modules/ethers/lib.esm/abi/coders/bytes.js":
/*!*********************************************************!*\
  !*** ./node_modules/ethers/lib.esm/abi/coders/bytes.js ***!
  \*********************************************************/
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "BytesCoder": () => (/* binding */ BytesCoder),
/* harmony export */   "DynamicBytesCoder": () => (/* binding */ DynamicBytesCoder)
/* harmony export */ });
/* harmony import */ var _utils_index_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../../utils/index.js */ "./node_modules/ethers/lib.esm/utils/data.js");
/* harmony import */ var _abstract_coder_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./abstract-coder.js */ "./node_modules/ethers/lib.esm/abi/coders/abstract-coder.js");


/**
 *  @_ignore
 */
class DynamicBytesCoder extends _abstract_coder_js__WEBPACK_IMPORTED_MODULE_0__.Coder {
    constructor(type, localName) {
        super(type, type, localName, true);
    }
    defaultValue() {
        return "0x";
    }
    encode(writer, value) {
        value = (0,_utils_index_js__WEBPACK_IMPORTED_MODULE_1__.getBytesCopy)(value);
        let length = writer.writeValue(value.length);
        length += writer.writeBytes(value);
        return length;
    }
    decode(reader) {
        return reader.readBytes(reader.readIndex(), true);
    }
}
/**
 *  @_ignore
 */
class BytesCoder extends DynamicBytesCoder {
    constructor(localName) {
        super("bytes", localName);
    }
    decode(reader) {
        return (0,_utils_index_js__WEBPACK_IMPORTED_MODULE_1__.hexlify)(super.decode(reader));
    }
}
//# sourceMappingURL=bytes.js.map

/***/ }),

/***/ "./node_modules/ethers/lib.esm/abi/coders/fixed-bytes.js":
/*!***************************************************************!*\
  !*** ./node_modules/ethers/lib.esm/abi/coders/fixed-bytes.js ***!
  \***************************************************************/
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "FixedBytesCoder": () => (/* binding */ FixedBytesCoder)
/* harmony export */ });
/* harmony import */ var _utils_index_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../../utils/index.js */ "./node_modules/ethers/lib.esm/utils/properties.js");
/* harmony import */ var _utils_index_js__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ../../utils/index.js */ "./node_modules/ethers/lib.esm/utils/data.js");
/* harmony import */ var _typed_js__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ../typed.js */ "./node_modules/ethers/lib.esm/abi/typed.js");
/* harmony import */ var _abstract_coder_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./abstract-coder.js */ "./node_modules/ethers/lib.esm/abi/coders/abstract-coder.js");



/**
 *  @_ignore
 */
class FixedBytesCoder extends _abstract_coder_js__WEBPACK_IMPORTED_MODULE_0__.Coder {
    size;
    constructor(size, localName) {
        let name = "bytes" + String(size);
        super(name, name, localName, false);
        (0,_utils_index_js__WEBPACK_IMPORTED_MODULE_1__.defineProperties)(this, { size }, { size: "number" });
    }
    defaultValue() {
        return ("0x0000000000000000000000000000000000000000000000000000000000000000").substring(0, 2 + this.size * 2);
    }
    encode(writer, _value) {
        let data = (0,_utils_index_js__WEBPACK_IMPORTED_MODULE_2__.getBytesCopy)(_typed_js__WEBPACK_IMPORTED_MODULE_3__.Typed.dereference(_value, this.type));
        if (data.length !== this.size) {
            this._throwError("incorrect data length", _value);
        }
        return writer.writeBytes(data);
    }
    decode(reader) {
        return (0,_utils_index_js__WEBPACK_IMPORTED_MODULE_2__.hexlify)(reader.readBytes(this.size));
    }
}
//# sourceMappingURL=fixed-bytes.js.map

/***/ }),

/***/ "./node_modules/ethers/lib.esm/abi/coders/null.js":
/*!********************************************************!*\
  !*** ./node_modules/ethers/lib.esm/abi/coders/null.js ***!
  \********************************************************/
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "NullCoder": () => (/* binding */ NullCoder)
/* harmony export */ });
/* harmony import */ var _abstract_coder_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./abstract-coder.js */ "./node_modules/ethers/lib.esm/abi/coders/abstract-coder.js");

const Empty = new Uint8Array([]);
/**
 *  @_ignore
 */
class NullCoder extends _abstract_coder_js__WEBPACK_IMPORTED_MODULE_0__.Coder {
    constructor(localName) {
        super("null", "", localName, false);
    }
    defaultValue() {
        return null;
    }
    encode(writer, value) {
        if (value != null) {
            this._throwError("not null", value);
        }
        return writer.writeBytes(Empty);
    }
    decode(reader) {
        reader.readBytes(0);
        return null;
    }
}
//# sourceMappingURL=null.js.map

/***/ }),

/***/ "./node_modules/ethers/lib.esm/abi/coders/number.js":
/*!**********************************************************!*\
  !*** ./node_modules/ethers/lib.esm/abi/coders/number.js ***!
  \**********************************************************/
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "NumberCoder": () => (/* binding */ NumberCoder)
/* harmony export */ });
/* harmony import */ var _utils_index_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../../utils/index.js */ "./node_modules/ethers/lib.esm/utils/properties.js");
/* harmony import */ var _utils_index_js__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ../../utils/index.js */ "./node_modules/ethers/lib.esm/utils/maths.js");
/* harmony import */ var _typed_js__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ../typed.js */ "./node_modules/ethers/lib.esm/abi/typed.js");
/* harmony import */ var _abstract_coder_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./abstract-coder.js */ "./node_modules/ethers/lib.esm/abi/coders/abstract-coder.js");



const BN_0 = BigInt(0);
const BN_1 = BigInt(1);
const BN_MAX_UINT256 = BigInt("0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff");
/**
 *  @_ignore
 */
class NumberCoder extends _abstract_coder_js__WEBPACK_IMPORTED_MODULE_0__.Coder {
    size;
    signed;
    constructor(size, signed, localName) {
        const name = ((signed ? "int" : "uint") + (size * 8));
        super(name, name, localName, false);
        (0,_utils_index_js__WEBPACK_IMPORTED_MODULE_1__.defineProperties)(this, { size, signed }, { size: "number", signed: "boolean" });
    }
    defaultValue() {
        return 0;
    }
    encode(writer, _value) {
        let value = (0,_utils_index_js__WEBPACK_IMPORTED_MODULE_2__.getBigInt)(_typed_js__WEBPACK_IMPORTED_MODULE_3__.Typed.dereference(_value, this.type));
        // Check bounds are safe for encoding
        let maxUintValue = (0,_utils_index_js__WEBPACK_IMPORTED_MODULE_2__.mask)(BN_MAX_UINT256, _abstract_coder_js__WEBPACK_IMPORTED_MODULE_0__.WordSize * 8);
        if (this.signed) {
            let bounds = (0,_utils_index_js__WEBPACK_IMPORTED_MODULE_2__.mask)(maxUintValue, (this.size * 8) - 1);
            if (value > bounds || value < -(bounds + BN_1)) {
                this._throwError("value out-of-bounds", _value);
            }
            value = (0,_utils_index_js__WEBPACK_IMPORTED_MODULE_2__.toTwos)(value, 8 * _abstract_coder_js__WEBPACK_IMPORTED_MODULE_0__.WordSize);
        }
        else if (value < BN_0 || value > (0,_utils_index_js__WEBPACK_IMPORTED_MODULE_2__.mask)(maxUintValue, this.size * 8)) {
            this._throwError("value out-of-bounds", _value);
        }
        return writer.writeValue(value);
    }
    decode(reader) {
        let value = (0,_utils_index_js__WEBPACK_IMPORTED_MODULE_2__.mask)(reader.readValue(), this.size * 8);
        if (this.signed) {
            value = (0,_utils_index_js__WEBPACK_IMPORTED_MODULE_2__.fromTwos)(value, this.size * 8);
        }
        return value;
    }
}
//# sourceMappingURL=number.js.map

/***/ }),

/***/ "./node_modules/ethers/lib.esm/abi/coders/string.js":
/*!**********************************************************!*\
  !*** ./node_modules/ethers/lib.esm/abi/coders/string.js ***!
  \**********************************************************/
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "StringCoder": () => (/* binding */ StringCoder)
/* harmony export */ });
/* harmony import */ var _utils_utf8_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../../utils/utf8.js */ "./node_modules/ethers/lib.esm/utils/utf8.js");
/* harmony import */ var _typed_js__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ../typed.js */ "./node_modules/ethers/lib.esm/abi/typed.js");
/* harmony import */ var _bytes_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./bytes.js */ "./node_modules/ethers/lib.esm/abi/coders/bytes.js");



/**
 *  @_ignore
 */
class StringCoder extends _bytes_js__WEBPACK_IMPORTED_MODULE_0__.DynamicBytesCoder {
    constructor(localName) {
        super("string", localName);
    }
    defaultValue() {
        return "";
    }
    encode(writer, _value) {
        return super.encode(writer, (0,_utils_utf8_js__WEBPACK_IMPORTED_MODULE_1__.toUtf8Bytes)(_typed_js__WEBPACK_IMPORTED_MODULE_2__.Typed.dereference(_value, "string")));
    }
    decode(reader) {
        return (0,_utils_utf8_js__WEBPACK_IMPORTED_MODULE_1__.toUtf8String)(super.decode(reader));
    }
}
//# sourceMappingURL=string.js.map

/***/ }),

/***/ "./node_modules/ethers/lib.esm/abi/coders/tuple.js":
/*!*********************************************************!*\
  !*** ./node_modules/ethers/lib.esm/abi/coders/tuple.js ***!
  \*********************************************************/
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "TupleCoder": () => (/* binding */ TupleCoder)
/* harmony export */ });
/* harmony import */ var _utils_properties_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../../utils/properties.js */ "./node_modules/ethers/lib.esm/utils/properties.js");
/* harmony import */ var _typed_js__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ../typed.js */ "./node_modules/ethers/lib.esm/abi/typed.js");
/* harmony import */ var _abstract_coder_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./abstract-coder.js */ "./node_modules/ethers/lib.esm/abi/coders/abstract-coder.js");
/* harmony import */ var _array_js__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./array.js */ "./node_modules/ethers/lib.esm/abi/coders/array.js");




/**
 *  @_ignore
 */
class TupleCoder extends _abstract_coder_js__WEBPACK_IMPORTED_MODULE_0__.Coder {
    coders;
    constructor(coders, localName) {
        let dynamic = false;
        const types = [];
        coders.forEach((coder) => {
            if (coder.dynamic) {
                dynamic = true;
            }
            types.push(coder.type);
        });
        const type = ("tuple(" + types.join(",") + ")");
        super("tuple", type, localName, dynamic);
        (0,_utils_properties_js__WEBPACK_IMPORTED_MODULE_1__.defineProperties)(this, { coders: Object.freeze(coders.slice()) });
    }
    defaultValue() {
        const values = [];
        this.coders.forEach((coder) => {
            values.push(coder.defaultValue());
        });
        // We only output named properties for uniquely named coders
        const uniqueNames = this.coders.reduce((accum, coder) => {
            const name = coder.localName;
            if (name) {
                if (!accum[name]) {
                    accum[name] = 0;
                }
                accum[name]++;
            }
            return accum;
        }, {});
        // Add named values
        this.coders.forEach((coder, index) => {
            let name = coder.localName;
            if (!name || uniqueNames[name] !== 1) {
                return;
            }
            if (name === "length") {
                name = "_length";
            }
            if (values[name] != null) {
                return;
            }
            values[name] = values[index];
        });
        return Object.freeze(values);
    }
    encode(writer, _value) {
        const value = _typed_js__WEBPACK_IMPORTED_MODULE_2__.Typed.dereference(_value, "tuple");
        return (0,_array_js__WEBPACK_IMPORTED_MODULE_3__.pack)(writer, this.coders, value);
    }
    decode(reader) {
        return (0,_array_js__WEBPACK_IMPORTED_MODULE_3__.unpack)(reader, this.coders);
    }
}
//# sourceMappingURL=tuple.js.map

/***/ }),

/***/ "./node_modules/ethers/lib.esm/abi/fragments.js":
/*!******************************************************!*\
  !*** ./node_modules/ethers/lib.esm/abi/fragments.js ***!
  \******************************************************/
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "ConstructorFragment": () => (/* binding */ ConstructorFragment),
/* harmony export */   "ErrorFragment": () => (/* binding */ ErrorFragment),
/* harmony export */   "EventFragment": () => (/* binding */ EventFragment),
/* harmony export */   "FallbackFragment": () => (/* binding */ FallbackFragment),
/* harmony export */   "Fragment": () => (/* binding */ Fragment),
/* harmony export */   "FunctionFragment": () => (/* binding */ FunctionFragment),
/* harmony export */   "NamedFragment": () => (/* binding */ NamedFragment),
/* harmony export */   "ParamType": () => (/* binding */ ParamType),
/* harmony export */   "StructFragment": () => (/* binding */ StructFragment)
/* harmony export */ });
/* harmony import */ var _utils_index_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../utils/index.js */ "./node_modules/ethers/lib.esm/utils/maths.js");
/* harmony import */ var _utils_index_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../utils/index.js */ "./node_modules/ethers/lib.esm/utils/errors.js");
/* harmony import */ var _utils_index_js__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ../utils/index.js */ "./node_modules/ethers/lib.esm/utils/properties.js");
/* harmony import */ var _hash_index_js__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ../hash/index.js */ "./node_modules/ethers/lib.esm/hash/id.js");
/**
 *  About frgaments...
 *
 *  @_subsection api/abi/abi-coder:Fragments  [about-fragments]
 */


;
// [ "a", "b" ] => { "a": 1, "b": 1 }
function setify(items) {
    const result = new Set();
    items.forEach((k) => result.add(k));
    return Object.freeze(result);
}
// Visibility Keywords
const _kwVisib = "constant external internal payable private public pure view";
const KwVisib = setify(_kwVisib.split(" "));
const _kwTypes = "constructor error event fallback function receive struct";
const KwTypes = setify(_kwTypes.split(" "));
const _kwModifiers = "calldata memory storage payable indexed";
const KwModifiers = setify(_kwModifiers.split(" "));
const _kwOther = "tuple returns";
// All Keywords
const _keywords = [_kwTypes, _kwModifiers, _kwOther, _kwVisib].join(" ");
const Keywords = setify(_keywords.split(" "));
// Single character tokens
const SimpleTokens = {
    "(": "OPEN_PAREN", ")": "CLOSE_PAREN",
    "[": "OPEN_BRACKET", "]": "CLOSE_BRACKET",
    ",": "COMMA", "@": "AT"
};
// Parser regexes to consume the next token
const regexWhitespacePrefix = new RegExp("^(\\s*)");
const regexNumberPrefix = new RegExp("^([0-9]+)");
const regexIdPrefix = new RegExp("^([a-zA-Z$_][a-zA-Z0-9$_]*)");
// Parser regexs to check validity
const regexId = new RegExp("^([a-zA-Z$_][a-zA-Z0-9$_]*)$");
const regexType = new RegExp("^(address|bool|bytes([0-9]*)|string|u?int([0-9]*))$");
class TokenString {
    #offset;
    #tokens;
    get offset() { return this.#offset; }
    get length() { return this.#tokens.length - this.#offset; }
    constructor(tokens) {
        this.#offset = 0;
        this.#tokens = tokens.slice();
    }
    clone() { return new TokenString(this.#tokens); }
    reset() { this.#offset = 0; }
    #subTokenString(from = 0, to = 0) {
        return new TokenString(this.#tokens.slice(from, to).map((t) => {
            return Object.freeze(Object.assign({}, t, {
                match: (t.match - from),
                linkBack: (t.linkBack - from),
                linkNext: (t.linkNext - from),
            }));
            return t;
        }));
    }
    // Pops and returns the value of the next token, if it is a keyword in allowed; throws if out of tokens
    popKeyword(allowed) {
        const top = this.peek();
        if (top.type !== "KEYWORD" || !allowed.has(top.text)) {
            throw new Error(`expected keyword ${top.text}`);
        }
        return this.pop().text;
    }
    // Pops and returns the value of the next token if it is `type`; throws if out of tokens
    popType(type) {
        if (this.peek().type !== type) {
            throw new Error(`expected ${type}; got ${JSON.stringify(this.peek())}`);
        }
        return this.pop().text;
    }
    // Pops and returns a "(" TOKENS ")"
    popParen() {
        const top = this.peek();
        if (top.type !== "OPEN_PAREN") {
            throw new Error("bad start");
        }
        const result = this.#subTokenString(this.#offset + 1, top.match + 1);
        this.#offset = top.match + 1;
        return result;
    }
    // Pops and returns the items within "(" ITEM1 "," ITEM2 "," ... ")"
    popParams() {
        const top = this.peek();
        if (top.type !== "OPEN_PAREN") {
            throw new Error("bad start");
        }
        const result = [];
        while (this.#offset < top.match - 1) {
            const link = this.peek().linkNext;
            result.push(this.#subTokenString(this.#offset + 1, link));
            this.#offset = link;
        }
        this.#offset = top.match + 1;
        return result;
    }
    // Returns the top Token, throwing if out of tokens
    peek() {
        if (this.#offset >= this.#tokens.length) {
            throw new Error("out-of-bounds");
        }
        return this.#tokens[this.#offset];
    }
    // Returns the next value, if it is a keyword in `allowed`
    peekKeyword(allowed) {
        const top = this.peekType("KEYWORD");
        return (top != null && allowed.has(top)) ? top : null;
    }
    // Returns the value of the next token if it is `type`
    peekType(type) {
        if (this.length === 0) {
            return null;
        }
        const top = this.peek();
        return (top.type === type) ? top.text : null;
    }
    // Returns the next token; throws if out of tokens
    pop() {
        const result = this.peek();
        this.#offset++;
        return result;
    }
    toString() {
        const tokens = [];
        for (let i = this.#offset; i < this.#tokens.length; i++) {
            const token = this.#tokens[i];
            tokens.push(`${token.type}:${token.text}`);
        }
        return `<TokenString ${tokens.join(" ")}>`;
    }
}
function lex(text) {
    const tokens = [];
    const throwError = (message) => {
        const token = (offset < text.length) ? JSON.stringify(text[offset]) : "$EOI";
        throw new Error(`invalid token ${token} at ${offset}: ${message}`);
    };
    let brackets = [];
    let commas = [];
    let offset = 0;
    while (offset < text.length) {
        // Strip off any leading whitespace
        let cur = text.substring(offset);
        let match = cur.match(regexWhitespacePrefix);
        if (match) {
            offset += match[1].length;
            cur = text.substring(offset);
        }
        const token = { depth: brackets.length, linkBack: -1, linkNext: -1, match: -1, type: "", text: "", offset, value: -1 };
        tokens.push(token);
        let type = (SimpleTokens[cur[0]] || "");
        if (type) {
            token.type = type;
            token.text = cur[0];
            offset++;
            if (type === "OPEN_PAREN") {
                brackets.push(tokens.length - 1);
                commas.push(tokens.length - 1);
            }
            else if (type == "CLOSE_PAREN") {
                if (brackets.length === 0) {
                    throwError("no matching open bracket");
                }
                token.match = brackets.pop();
                (tokens[token.match]).match = tokens.length - 1;
                token.depth--;
                token.linkBack = commas.pop();
                (tokens[token.linkBack]).linkNext = tokens.length - 1;
            }
            else if (type === "COMMA") {
                token.linkBack = commas.pop();
                (tokens[token.linkBack]).linkNext = tokens.length - 1;
                commas.push(tokens.length - 1);
            }
            else if (type === "OPEN_BRACKET") {
                token.type = "BRACKET";
            }
            else if (type === "CLOSE_BRACKET") {
                // Remove the CLOSE_BRACKET
                let suffix = tokens.pop().text;
                if (tokens.length > 0 && tokens[tokens.length - 1].type === "NUMBER") {
                    const value = tokens.pop().text;
                    suffix = value + suffix;
                    (tokens[tokens.length - 1]).value = (0,_utils_index_js__WEBPACK_IMPORTED_MODULE_0__.getNumber)(value);
                }
                if (tokens.length === 0 || tokens[tokens.length - 1].type !== "BRACKET") {
                    throw new Error("missing opening bracket");
                }
                (tokens[tokens.length - 1]).text += suffix;
            }
            continue;
        }
        match = cur.match(regexIdPrefix);
        if (match) {
            token.text = match[1];
            offset += token.text.length;
            if (Keywords.has(token.text)) {
                token.type = "KEYWORD";
                continue;
            }
            if (token.text.match(regexType)) {
                token.type = "TYPE";
                continue;
            }
            token.type = "ID";
            continue;
        }
        match = cur.match(regexNumberPrefix);
        if (match) {
            token.text = match[1];
            token.type = "NUMBER";
            offset += token.text.length;
            continue;
        }
        throw new Error(`unexpected token ${JSON.stringify(cur[0])} at position ${offset}`);
    }
    return new TokenString(tokens.map((t) => Object.freeze(t)));
}
// Check only one of `allowed` is in `set`
function allowSingle(set, allowed) {
    let included = [];
    for (const key in allowed.keys()) {
        if (set.has(key)) {
            included.push(key);
        }
    }
    if (included.length > 1) {
        throw new Error(`conflicting types: ${included.join(", ")}`);
    }
}
// Functions to process a Solidity Signature TokenString from left-to-right for...
// ...the name with an optional type, returning the name
function consumeName(type, tokens) {
    if (tokens.peekKeyword(KwTypes)) {
        const keyword = tokens.pop().text;
        if (keyword !== type) {
            throw new Error(`expected ${type}, got ${keyword}`);
        }
    }
    return tokens.popType("ID");
}
// ...all keywords matching allowed, returning the keywords
function consumeKeywords(tokens, allowed) {
    const keywords = new Set();
    while (true) {
        const keyword = tokens.peekType("KEYWORD");
        if (keyword == null || (allowed && !allowed.has(keyword))) {
            break;
        }
        tokens.pop();
        if (keywords.has(keyword)) {
            throw new Error(`duplicate keywords: ${JSON.stringify(keyword)}`);
        }
        keywords.add(keyword);
    }
    return Object.freeze(keywords);
}
// ...all visibility keywords, returning the coalesced mutability
function consumeMutability(tokens) {
    let modifiers = consumeKeywords(tokens, KwVisib);
    // Detect conflicting modifiers
    allowSingle(modifiers, setify("constant payable nonpayable".split(" ")));
    allowSingle(modifiers, setify("pure view payable nonpayable".split(" ")));
    // Process mutability states
    if (modifiers.has("view")) {
        return "view";
    }
    if (modifiers.has("pure")) {
        return "pure";
    }
    if (modifiers.has("payable")) {
        return "payable";
    }
    if (modifiers.has("nonpayable")) {
        return "nonpayable";
    }
    // Process legacy `constant` last
    if (modifiers.has("constant")) {
        return "view";
    }
    return "nonpayable";
}
// ...a parameter list, returning the ParamType list
function consumeParams(tokens, allowIndexed) {
    return tokens.popParams().map((t) => ParamType.from(t, allowIndexed));
}
// ...a gas limit, returning a BigNumber or null if none
function consumeGas(tokens) {
    if (tokens.peekType("AT")) {
        tokens.pop();
        if (tokens.peekType("NUMBER")) {
            return (0,_utils_index_js__WEBPACK_IMPORTED_MODULE_0__.getBigInt)(tokens.pop().text);
        }
        throw new Error("invalid gas");
    }
    return null;
}
function consumeEoi(tokens) {
    if (tokens.length) {
        throw new Error(`unexpected tokens: ${tokens.toString()}`);
    }
}
const regexArrayType = new RegExp(/^(.*)\[([0-9]*)\]$/);
function verifyBasicType(type) {
    const match = type.match(regexType);
    (0,_utils_index_js__WEBPACK_IMPORTED_MODULE_1__.assertArgument)(match, "invalid type", "type", type);
    if (type === "uint") {
        return "uint256";
    }
    if (type === "int") {
        return "int256";
    }
    if (match[2]) {
        // bytesXX
        const length = parseInt(match[2]);
        (0,_utils_index_js__WEBPACK_IMPORTED_MODULE_1__.assertArgument)(length !== 0 && length <= 32, "invalid bytes length", "type", type);
    }
    else if (match[3]) {
        // intXX or uintXX
        const size = parseInt(match[3]);
        (0,_utils_index_js__WEBPACK_IMPORTED_MODULE_1__.assertArgument)(size !== 0 && size <= 256 && (size % 8) === 0, "invalid numeric width", "type", type);
    }
    return type;
}
// Make the Fragment constructors effectively private
const _guard = {};
const internal = Symbol.for("_ethers_internal");
const ParamTypeInternal = "_ParamTypeInternal";
const ErrorFragmentInternal = "_ErrorInternal";
const EventFragmentInternal = "_EventInternal";
const ConstructorFragmentInternal = "_ConstructorInternal";
const FallbackFragmentInternal = "_FallbackInternal";
const FunctionFragmentInternal = "_FunctionInternal";
const StructFragmentInternal = "_StructInternal";
/**
 *  Each input and output of a [[Fragment]] is an Array of **PAramType**.
 */
class ParamType {
    /**
     *  The local name of the parameter (or ``""`` if unbound)
     */
    name;
    /**
     *  The fully qualified type (e.g. ``"address"``, ``"tuple(address)"``,
     *  ``"uint256[3][]"``)
     */
    type;
    /**
     *  The base type (e.g. ``"address"``, ``"tuple"``, ``"array"``)
     */
    baseType;
    /**
     *  True if the parameters is indexed.
     *
     *  For non-indexable types this is ``null``.
     */
    indexed;
    /**
     *  The components for the tuple.
     *
     *  For non-tuple types this is ``null``.
     */
    components;
    /**
     *  The array length, or ``-1`` for dynamic-lengthed arrays.
     *
     *  For non-array types this is ``null``.
     */
    arrayLength;
    /**
     *  The type of each child in the array.
     *
     *  For non-array types this is ``null``.
     */
    arrayChildren;
    /**
     *  @private
     */
    constructor(guard, name, type, baseType, indexed, components, arrayLength, arrayChildren) {
        (0,_utils_index_js__WEBPACK_IMPORTED_MODULE_1__.assertPrivate)(guard, _guard, "ParamType");
        Object.defineProperty(this, internal, { value: ParamTypeInternal });
        if (components) {
            components = Object.freeze(components.slice());
        }
        if (baseType === "array") {
            if (arrayLength == null || arrayChildren == null) {
                throw new Error("");
            }
        }
        else if (arrayLength != null || arrayChildren != null) {
            throw new Error("");
        }
        if (baseType === "tuple") {
            if (components == null) {
                throw new Error("");
            }
        }
        else if (components != null) {
            throw new Error("");
        }
        (0,_utils_index_js__WEBPACK_IMPORTED_MODULE_2__.defineProperties)(this, {
            name, type, baseType, indexed, components, arrayLength, arrayChildren
        });
    }
    /**
     *  Return a string representation of this type.
     *
     *  For example,
     *
     *  ``sighash" => "(uint256,address)"``
     *
     *  ``"minimal" => "tuple(uint256,address) indexed"``
     *
     *  ``"full" => "tuple(uint256 foo, address bar) indexed baz"``
     */
    format(format) {
        if (format == null) {
            format = "sighash";
        }
        if (format === "json") {
            let result = {
                type: ((this.baseType === "tuple") ? "tuple" : this.type),
                name: (this.name || undefined)
            };
            if (typeof (this.indexed) === "boolean") {
                result.indexed = this.indexed;
            }
            if (this.isTuple()) {
                result.components = this.components.map((c) => JSON.parse(c.format(format)));
            }
            return JSON.stringify(result);
        }
        let result = "";
        // Array
        if (this.isArray()) {
            result += this.arrayChildren.format(format);
            result += `[${(this.arrayLength < 0 ? "" : String(this.arrayLength))}]`;
        }
        else {
            if (this.isTuple()) {
                if (format !== "sighash") {
                    result += this.type;
                }
                result += "(" + this.components.map((comp) => comp.format(format)).join((format === "full") ? ", " : ",") + ")";
            }
            else {
                result += this.type;
            }
        }
        if (format !== "sighash") {
            if (this.indexed === true) {
                result += " indexed";
            }
            if (format === "full" && this.name) {
                result += " " + this.name;
            }
        }
        return result;
    }
    /*
     *  Returns true if %%value%% is an Array type.
     *
     *  This provides a type gaurd ensuring that the
     *  [[arrayChildren]] and [[arrayLength]] are non-null.
     */
    //static isArray(value: any): value is { arrayChildren: ParamType, arrayLength: number } {
    //    return value && (value.baseType === "array")
    //}
    /**
     *  Returns true if %%this%% is an Array type.
     *
     *  This provides a type gaurd ensuring that [[arrayChildren]]
     *  and [[arrayLength]] are non-null.
     */
    isArray() {
        return (this.baseType === "array");
    }
    /**
     *  Returns true if %%this%% is a Tuple type.
     *
     *  This provides a type gaurd ensuring that [[components]]
     *  is non-null.
     */
    isTuple() {
        return (this.baseType === "tuple");
    }
    /**
     *  Returns true if %%this%% is an Indexable type.
     *
     *  This provides a type gaurd ensuring that [[indexed]]
     *  is non-null.
     */
    isIndexable() {
        return (this.indexed != null);
    }
    /**
     *  Walks the **ParamType** with %%value%%, calling %%process%%
     *  on each type, destructing the %%value%% recursively.
     */
    walk(value, process) {
        if (this.isArray()) {
            if (!Array.isArray(value)) {
                throw new Error("invlaid array value");
            }
            if (this.arrayLength !== -1 && value.length !== this.arrayLength) {
                throw new Error("array is wrong length");
            }
            const _this = this;
            return value.map((v) => (_this.arrayChildren.walk(v, process)));
        }
        if (this.isTuple()) {
            if (!Array.isArray(value)) {
                throw new Error("invlaid tuple value");
            }
            if (value.length !== this.components.length) {
                throw new Error("array is wrong length");
            }
            const _this = this;
            return value.map((v, i) => (_this.components[i].walk(v, process)));
        }
        return process(this.type, value);
    }
    #walkAsync(promises, value, process, setValue) {
        if (this.isArray()) {
            if (!Array.isArray(value)) {
                throw new Error("invlaid array value");
            }
            if (this.arrayLength !== -1 && value.length !== this.arrayLength) {
                throw new Error("array is wrong length");
            }
            const childType = this.arrayChildren;
            const result = value.slice();
            result.forEach((value, index) => {
                childType.#walkAsync(promises, value, process, (value) => {
                    result[index] = value;
                });
            });
            setValue(result);
            return;
        }
        if (this.isTuple()) {
            const components = this.components;
            // Convert the object into an array
            let result;
            if (Array.isArray(value)) {
                result = value.slice();
            }
            else {
                if (value == null || typeof (value) !== "object") {
                    throw new Error("invlaid tuple value");
                }
                result = components.map((param) => {
                    if (!param.name) {
                        throw new Error("cannot use object value with unnamed components");
                    }
                    if (!(param.name in value)) {
                        throw new Error(`missing value for component ${param.name}`);
                    }
                    return value[param.name];
                });
            }
            if (result.length !== this.components.length) {
                throw new Error("array is wrong length");
            }
            result.forEach((value, index) => {
                components[index].#walkAsync(promises, value, process, (value) => {
                    result[index] = value;
                });
            });
            setValue(result);
            return;
        }
        const result = process(this.type, value);
        if (result.then) {
            promises.push((async function () { setValue(await result); })());
        }
        else {
            setValue(result);
        }
    }
    /**
     *  Walks the **ParamType** with %%value%%, asynchronously calling
     *  %%process%% on each type, destructing the %%value%% recursively.
     *
     *  This can be used to resolve ENS naes by walking and resolving each
     *  ``"address"`` type.
     */
    async walkAsync(value, process) {
        const promises = [];
        const result = [value];
        this.#walkAsync(promises, value, process, (value) => {
            result[0] = value;
        });
        if (promises.length) {
            await Promise.all(promises);
        }
        return result[0];
    }
    /**
     *  Creates a new **ParamType** for %%obj%%.
     *
     *  If %%allowIndexed%% then the ``indexed`` keyword is permitted,
     *  otherwise the ``indexed`` keyword will throw an error.
     */
    static from(obj, allowIndexed) {
        if (ParamType.isParamType(obj)) {
            return obj;
        }
        if (typeof (obj) === "string") {
            return ParamType.from(lex(obj), allowIndexed);
        }
        else if (obj instanceof TokenString) {
            let type = "", baseType = "";
            let comps = null;
            if (consumeKeywords(obj, setify(["tuple"])).has("tuple") || obj.peekType("OPEN_PAREN")) {
                // Tuple
                baseType = "tuple";
                comps = obj.popParams().map((t) => ParamType.from(t));
                type = `tuple(${comps.map((c) => c.format()).join(",")})`;
            }
            else {
                // Normal
                type = verifyBasicType(obj.popType("TYPE"));
                baseType = type;
            }
            // Check for Array
            let arrayChildren = null;
            let arrayLength = null;
            while (obj.length && obj.peekType("BRACKET")) {
                const bracket = obj.pop(); //arrays[i];
                arrayChildren = new ParamType(_guard, "", type, baseType, null, comps, arrayLength, arrayChildren);
                arrayLength = bracket.value;
                type += bracket.text;
                baseType = "array";
                comps = null;
            }
            let indexed = null;
            const keywords = consumeKeywords(obj, KwModifiers);
            if (keywords.has("indexed")) {
                if (!allowIndexed) {
                    throw new Error("");
                }
                indexed = true;
            }
            const name = (obj.peekType("ID") ? obj.pop().text : "");
            if (obj.length) {
                throw new Error("leftover tokens");
            }
            return new ParamType(_guard, name, type, baseType, indexed, comps, arrayLength, arrayChildren);
        }
        const name = obj.name;
        (0,_utils_index_js__WEBPACK_IMPORTED_MODULE_1__.assertArgument)(!name || (typeof (name) === "string" && name.match(regexId)), "invalid name", "obj.name", name);
        let indexed = obj.indexed;
        if (indexed != null) {
            (0,_utils_index_js__WEBPACK_IMPORTED_MODULE_1__.assertArgument)(allowIndexed, "parameter cannot be indexed", "obj.indexed", obj.indexed);
            indexed = !!indexed;
        }
        let type = obj.type;
        let arrayMatch = type.match(regexArrayType);
        if (arrayMatch) {
            const arrayLength = parseInt(arrayMatch[2] || "-1");
            const arrayChildren = ParamType.from({
                type: arrayMatch[1],
                components: obj.components
            });
            return new ParamType(_guard, name || "", type, "array", indexed, null, arrayLength, arrayChildren);
        }
        if (type === "tuple" || type.startsWith("tuple(" /* fix: ) */) || type.startsWith("(" /* fix: ) */)) {
            const comps = (obj.components != null) ? obj.components.map((c) => ParamType.from(c)) : null;
            const tuple = new ParamType(_guard, name || "", type, "tuple", indexed, comps, null, null);
            // @TODO: use lexer to validate and normalize type
            return tuple;
        }
        type = verifyBasicType(obj.type);
        return new ParamType(_guard, name || "", type, type, indexed, null, null, null);
    }
    /**
     *  Returns true if %%value%% is a **ParamType**.
     */
    static isParamType(value) {
        return (value && value[internal] === ParamTypeInternal);
    }
}
/**
 *  An abstract class to represent An individual fragment from a parse ABI.
 */
class Fragment {
    /**
     *  The type of the fragment.
     */
    type;
    /**
     *  The inputs for the fragment.
     */
    inputs;
    /**
     *  @private
     */
    constructor(guard, type, inputs) {
        (0,_utils_index_js__WEBPACK_IMPORTED_MODULE_1__.assertPrivate)(guard, _guard, "Fragment");
        inputs = Object.freeze(inputs.slice());
        (0,_utils_index_js__WEBPACK_IMPORTED_MODULE_2__.defineProperties)(this, { type, inputs });
    }
    /**
     *  Creates a new **Fragment** for %%obj%%, wich can be any supported
     *  ABI frgament type.
     */
    static from(obj) {
        if (typeof (obj) === "string") {
            // Try parsing JSON...
            try {
                Fragment.from(JSON.parse(obj));
            }
            catch (e) { }
            // ...otherwise, use the human-readable lexer
            return Fragment.from(lex(obj));
        }
        if (obj instanceof TokenString) {
            // Human-readable ABI (already lexed)
            const type = obj.peekKeyword(KwTypes);
            switch (type) {
                case "constructor": return ConstructorFragment.from(obj);
                case "error": return ErrorFragment.from(obj);
                case "event": return EventFragment.from(obj);
                case "fallback":
                case "receive":
                    return FallbackFragment.from(obj);
                case "function": return FunctionFragment.from(obj);
                case "struct": return StructFragment.from(obj);
            }
        }
        else if (typeof (obj) === "object") {
            // JSON ABI
            switch (obj.type) {
                case "constructor": return ConstructorFragment.from(obj);
                case "error": return ErrorFragment.from(obj);
                case "event": return EventFragment.from(obj);
                case "fallback":
                case "receive":
                    return FallbackFragment.from(obj);
                case "function": return FunctionFragment.from(obj);
                case "struct": return StructFragment.from(obj);
            }
            (0,_utils_index_js__WEBPACK_IMPORTED_MODULE_1__.assert)(false, `unsupported type: ${obj.type}`, "UNSUPPORTED_OPERATION", {
                operation: "Fragment.from"
            });
        }
        (0,_utils_index_js__WEBPACK_IMPORTED_MODULE_1__.assertArgument)(false, "unsupported frgament object", "obj", obj);
    }
    /**
     *  Returns true if %%value%% is a [[ConstructorFragment]].
     */
    static isConstructor(value) {
        return ConstructorFragment.isFragment(value);
    }
    /**
     *  Returns true if %%value%% is an [[ErrorFragment]].
     */
    static isError(value) {
        return ErrorFragment.isFragment(value);
    }
    /**
     *  Returns true if %%value%% is an [[EventFragment]].
     */
    static isEvent(value) {
        return EventFragment.isFragment(value);
    }
    /**
     *  Returns true if %%value%% is a [[FunctionFragment]].
     */
    static isFunction(value) {
        return FunctionFragment.isFragment(value);
    }
    /**
     *  Returns true if %%value%% is a [[StructFragment]].
     */
    static isStruct(value) {
        return StructFragment.isFragment(value);
    }
}
/**
 *  An abstract class to represent An individual fragment
 *  which has a name from a parse ABI.
 */
class NamedFragment extends Fragment {
    /**
     *  The name of the fragment.
     */
    name;
    /**
     *  @private
     */
    constructor(guard, type, name, inputs) {
        super(guard, type, inputs);
        (0,_utils_index_js__WEBPACK_IMPORTED_MODULE_1__.assertArgument)(typeof (name) === "string" && name.match(regexId), "invalid identifier", "name", name);
        inputs = Object.freeze(inputs.slice());
        (0,_utils_index_js__WEBPACK_IMPORTED_MODULE_2__.defineProperties)(this, { name });
    }
}
function joinParams(format, params) {
    return "(" + params.map((p) => p.format(format)).join((format === "full") ? ", " : ",") + ")";
}
/**
 *  A Fragment which represents a //Custom Error//.
 */
class ErrorFragment extends NamedFragment {
    /**
     *  @private
     */
    constructor(guard, name, inputs) {
        super(guard, "error", name, inputs);
        Object.defineProperty(this, internal, { value: ErrorFragmentInternal });
    }
    /**
     *  The Custom Error selector.
     */
    get selector() {
        return (0,_hash_index_js__WEBPACK_IMPORTED_MODULE_3__.id)(this.format("sighash")).substring(0, 10);
    }
    format(format) {
        if (format == null) {
            format = "sighash";
        }
        if (format === "json") {
            return JSON.stringify({
                type: "error",
                name: this.name,
                inputs: this.inputs.map((input) => JSON.parse(input.format(format))),
            });
        }
        const result = [];
        if (format !== "sighash") {
            result.push("error");
        }
        result.push(this.name + joinParams(format, this.inputs));
        return result.join(" ");
    }
    static from(obj) {
        if (ErrorFragment.isFragment(obj)) {
            return obj;
        }
        if (typeof (obj) === "string") {
            return ErrorFragment.from(lex(obj));
        }
        else if (obj instanceof TokenString) {
            const name = consumeName("error", obj);
            const inputs = consumeParams(obj);
            consumeEoi(obj);
            return new ErrorFragment(_guard, name, inputs);
        }
        return new ErrorFragment(_guard, obj.name, obj.inputs ? obj.inputs.map(ParamType.from) : []);
    }
    static isFragment(value) {
        return (value && value[internal] === ErrorFragmentInternal);
    }
}
/**
 *  A Fragment which represents an Event.
 */
class EventFragment extends NamedFragment {
    anonymous;
    /**
     *  @private
     */
    constructor(guard, name, inputs, anonymous) {
        super(guard, "event", name, inputs);
        Object.defineProperty(this, internal, { value: EventFragmentInternal });
        (0,_utils_index_js__WEBPACK_IMPORTED_MODULE_2__.defineProperties)(this, { anonymous });
    }
    /**
     *  The Event topic hash.
     */
    get topicHash() {
        return (0,_hash_index_js__WEBPACK_IMPORTED_MODULE_3__.id)(this.format("sighash"));
    }
    format(format) {
        if (format == null) {
            format = "sighash";
        }
        if (format === "json") {
            return JSON.stringify({
                type: "event",
                anonymous: this.anonymous,
                name: this.name,
                inputs: this.inputs.map((i) => JSON.parse(i.format(format)))
            });
        }
        const result = [];
        if (format !== "sighash") {
            result.push("event");
        }
        result.push(this.name + joinParams(format, this.inputs));
        if (format !== "sighash" && this.anonymous) {
            result.push("anonymous");
        }
        return result.join(" ");
    }
    static getTopicHash(name, params) {
        params = (params || []).map((p) => ParamType.from(p));
        const fragment = new EventFragment(_guard, name, params, false);
        return fragment.topicHash;
    }
    static from(obj) {
        if (EventFragment.isFragment(obj)) {
            return obj;
        }
        if (typeof (obj) === "string") {
            return EventFragment.from(lex(obj));
        }
        else if (obj instanceof TokenString) {
            const name = consumeName("event", obj);
            const inputs = consumeParams(obj, true);
            const anonymous = !!consumeKeywords(obj, setify(["anonymous"])).has("anonymous");
            consumeEoi(obj);
            return new EventFragment(_guard, name, inputs, anonymous);
        }
        return new EventFragment(_guard, obj.name, obj.inputs ? obj.inputs.map((p) => ParamType.from(p, true)) : [], !!obj.anonymous);
    }
    static isFragment(value) {
        return (value && value[internal] === EventFragmentInternal);
    }
}
/**
 *  A Fragment which represents a constructor.
 */
class ConstructorFragment extends Fragment {
    payable;
    gas;
    /**
     *  @private
     */
    constructor(guard, type, inputs, payable, gas) {
        super(guard, type, inputs);
        Object.defineProperty(this, internal, { value: ConstructorFragmentInternal });
        (0,_utils_index_js__WEBPACK_IMPORTED_MODULE_2__.defineProperties)(this, { payable, gas });
    }
    format(format) {
        (0,_utils_index_js__WEBPACK_IMPORTED_MODULE_1__.assert)(format != null && format !== "sighash", "cannot format a constructor for sighash", "UNSUPPORTED_OPERATION", { operation: "format(sighash)" });
        if (format === "json") {
            return JSON.stringify({
                type: "constructor",
                stateMutability: (this.payable ? "payable" : "undefined"),
                payable: this.payable,
                gas: ((this.gas != null) ? this.gas : undefined),
                inputs: this.inputs.map((i) => JSON.parse(i.format(format)))
            });
        }
        const result = [`constructor${joinParams(format, this.inputs)}`];
        result.push((this.payable) ? "payable" : "nonpayable");
        if (this.gas != null) {
            result.push(`@${this.gas.toString()}`);
        }
        return result.join(" ");
    }
    static from(obj) {
        if (ConstructorFragment.isFragment(obj)) {
            return obj;
        }
        if (typeof (obj) === "string") {
            return ConstructorFragment.from(lex(obj));
        }
        else if (obj instanceof TokenString) {
            consumeKeywords(obj, setify(["constructor"]));
            const inputs = consumeParams(obj);
            const payable = !!consumeKeywords(obj, setify(["payable"])).has("payable");
            const gas = consumeGas(obj);
            consumeEoi(obj);
            return new ConstructorFragment(_guard, "constructor", inputs, payable, gas);
        }
        return new ConstructorFragment(_guard, "constructor", obj.inputs ? obj.inputs.map(ParamType.from) : [], !!obj.payable, (obj.gas != null) ? obj.gas : null);
    }
    static isFragment(value) {
        return (value && value[internal] === ConstructorFragmentInternal);
    }
}
/**
 *  A Fragment which represents a method.
 */
class FallbackFragment extends Fragment {
    /**
     *  If the function can be sent value during invocation.
     */
    payable;
    constructor(guard, inputs, payable) {
        super(guard, "fallback", inputs);
        Object.defineProperty(this, internal, { value: FallbackFragmentInternal });
        (0,_utils_index_js__WEBPACK_IMPORTED_MODULE_2__.defineProperties)(this, { payable });
    }
    format(format) {
        const type = ((this.inputs.length === 0) ? "receive" : "fallback");
        if (format === "json") {
            const stateMutability = (this.payable ? "payable" : "nonpayable");
            return JSON.stringify({ type, stateMutability });
        }
        return `${type}()${this.payable ? " payable" : ""}`;
    }
    static from(obj) {
        if (FallbackFragment.isFragment(obj)) {
            return obj;
        }
        if (typeof (obj) === "string") {
            return FallbackFragment.from(lex(obj));
        }
        else if (obj instanceof TokenString) {
            const errorObj = obj.toString();
            const topIsValid = obj.peekKeyword(setify(["fallback", "receive"]));
            (0,_utils_index_js__WEBPACK_IMPORTED_MODULE_1__.assertArgument)(topIsValid, "type must be fallback or receive", "obj", errorObj);
            const type = obj.popKeyword(setify(["fallback", "receive"]));
            // receive()
            if (type === "receive") {
                const inputs = consumeParams(obj);
                (0,_utils_index_js__WEBPACK_IMPORTED_MODULE_1__.assertArgument)(inputs.length === 0, `receive cannot have arguments`, "obj.inputs", inputs);
                consumeKeywords(obj, setify(["payable"]));
                consumeEoi(obj);
                return new FallbackFragment(_guard, [], true);
            }
            // fallback() [payable]
            // fallback(bytes) [payable] returns (bytes)
            let inputs = consumeParams(obj);
            if (inputs.length) {
                (0,_utils_index_js__WEBPACK_IMPORTED_MODULE_1__.assertArgument)(inputs.length === 1 && inputs[0].type === "bytes", "invalid fallback inputs", "obj.inputs", inputs.map((i) => i.format("minimal")).join(", "));
            }
            else {
                inputs = [ParamType.from("bytes")];
            }
            const mutability = consumeMutability(obj);
            (0,_utils_index_js__WEBPACK_IMPORTED_MODULE_1__.assertArgument)(mutability === "nonpayable" || mutability === "payable", "fallback cannot be constants", "obj.stateMutability", mutability);
            if (consumeKeywords(obj, setify(["returns"])).has("returns")) {
                const outputs = consumeParams(obj);
                (0,_utils_index_js__WEBPACK_IMPORTED_MODULE_1__.assertArgument)(outputs.length === 1 && outputs[0].type === "bytes", "invalid fallback outputs", "obj.outputs", outputs.map((i) => i.format("minimal")).join(", "));
            }
            consumeEoi(obj);
            return new FallbackFragment(_guard, inputs, mutability === "payable");
        }
        if (obj.type === "receive") {
            return new FallbackFragment(_guard, [], true);
        }
        if (obj.type === "fallback") {
            const inputs = [ParamType.from("bytes")];
            const payable = (obj.stateMutability === "payable");
            return new FallbackFragment(_guard, inputs, payable);
        }
        (0,_utils_index_js__WEBPACK_IMPORTED_MODULE_1__.assertArgument)(false, "invalid fallback description", "obj", obj);
    }
    static isFragment(value) {
        return (value && value[internal] === FallbackFragmentInternal);
    }
}
/**
 *  A Fragment which represents a method.
 */
class FunctionFragment extends NamedFragment {
    /**
     *  If the function is constant (e.g. ``pure`` or ``view`` functions).
     */
    constant;
    /**
     *  The returned types for the result of calling this function.
     */
    outputs;
    /**
     *  The state mutability (e.g. ``payable``, ``nonpayable``, ``view``
     *  or ``pure``)
     */
    stateMutability;
    /**
     *  If the function can be sent value during invocation.
     */
    payable;
    /**
     *  The amount of gas to send when calling this function
     */
    gas;
    /**
     *  @private
     */
    constructor(guard, name, stateMutability, inputs, outputs, gas) {
        super(guard, "function", name, inputs);
        Object.defineProperty(this, internal, { value: FunctionFragmentInternal });
        outputs = Object.freeze(outputs.slice());
        const constant = (stateMutability === "view" || stateMutability === "pure");
        const payable = (stateMutability === "payable");
        (0,_utils_index_js__WEBPACK_IMPORTED_MODULE_2__.defineProperties)(this, { constant, gas, outputs, payable, stateMutability });
    }
    /**
     *  The Function selector.
     */
    get selector() {
        return (0,_hash_index_js__WEBPACK_IMPORTED_MODULE_3__.id)(this.format("sighash")).substring(0, 10);
    }
    format(format) {
        if (format == null) {
            format = "sighash";
        }
        if (format === "json") {
            return JSON.stringify({
                type: "function",
                name: this.name,
                constant: this.constant,
                stateMutability: ((this.stateMutability !== "nonpayable") ? this.stateMutability : undefined),
                payable: this.payable,
                gas: ((this.gas != null) ? this.gas : undefined),
                inputs: this.inputs.map((i) => JSON.parse(i.format(format))),
                outputs: this.outputs.map((o) => JSON.parse(o.format(format))),
            });
        }
        const result = [];
        if (format !== "sighash") {
            result.push("function");
        }
        result.push(this.name + joinParams(format, this.inputs));
        if (format !== "sighash") {
            if (this.stateMutability !== "nonpayable") {
                result.push(this.stateMutability);
            }
            if (this.outputs && this.outputs.length) {
                result.push("returns");
                result.push(joinParams(format, this.outputs));
            }
            if (this.gas != null) {
                result.push(`@${this.gas.toString()}`);
            }
        }
        return result.join(" ");
    }
    static getSelector(name, params) {
        params = (params || []).map((p) => ParamType.from(p));
        const fragment = new FunctionFragment(_guard, name, "view", params, [], null);
        return fragment.selector;
    }
    static from(obj) {
        if (FunctionFragment.isFragment(obj)) {
            return obj;
        }
        if (typeof (obj) === "string") {
            return FunctionFragment.from(lex(obj));
        }
        else if (obj instanceof TokenString) {
            const name = consumeName("function", obj);
            const inputs = consumeParams(obj);
            const mutability = consumeMutability(obj);
            let outputs = [];
            if (consumeKeywords(obj, setify(["returns"])).has("returns")) {
                outputs = consumeParams(obj);
            }
            const gas = consumeGas(obj);
            consumeEoi(obj);
            return new FunctionFragment(_guard, name, mutability, inputs, outputs, gas);
        }
        // @TODO: verifyState for stateMutability
        return new FunctionFragment(_guard, obj.name, obj.stateMutability, obj.inputs ? obj.inputs.map(ParamType.from) : [], obj.outputs ? obj.outputs.map(ParamType.from) : [], (obj.gas != null) ? obj.gas : null);
    }
    static isFragment(value) {
        return (value && value[internal] === FunctionFragmentInternal);
    }
}
/**
 *  A Fragment which represents a structure.
 */
class StructFragment extends NamedFragment {
    /**
     *  @private
     */
    constructor(guard, name, inputs) {
        super(guard, "struct", name, inputs);
        Object.defineProperty(this, internal, { value: StructFragmentInternal });
    }
    format() {
        throw new Error("@TODO");
    }
    static from(obj) {
        if (typeof (obj) === "string") {
            return StructFragment.from(lex(obj));
        }
        else if (obj instanceof TokenString) {
            const name = consumeName("struct", obj);
            const inputs = consumeParams(obj);
            consumeEoi(obj);
            return new StructFragment(_guard, name, inputs);
        }
        return new StructFragment(_guard, obj.name, obj.inputs ? obj.inputs.map(ParamType.from) : []);
    }
    static isFragment(value) {
        return (value && value[internal] === StructFragmentInternal);
    }
}
//# sourceMappingURL=fragments.js.map

/***/ }),

/***/ "./node_modules/ethers/lib.esm/abi/interface.js":
/*!******************************************************!*\
  !*** ./node_modules/ethers/lib.esm/abi/interface.js ***!
  \******************************************************/
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "ErrorDescription": () => (/* binding */ ErrorDescription),
/* harmony export */   "Indexed": () => (/* binding */ Indexed),
/* harmony export */   "Interface": () => (/* binding */ Interface),
/* harmony export */   "LogDescription": () => (/* binding */ LogDescription),
/* harmony export */   "Result": () => (/* reexport safe */ _coders_abstract_coder_js__WEBPACK_IMPORTED_MODULE_0__.Result),
/* harmony export */   "TransactionDescription": () => (/* binding */ TransactionDescription),
/* harmony export */   "checkResultErrors": () => (/* reexport safe */ _coders_abstract_coder_js__WEBPACK_IMPORTED_MODULE_0__.checkResultErrors)
/* harmony export */ });
/* harmony import */ var _crypto_index_js__WEBPACK_IMPORTED_MODULE_8__ = __webpack_require__(/*! ../crypto/index.js */ "./node_modules/ethers/lib.esm/crypto/keccak.js");
/* harmony import */ var _hash_index_js__WEBPACK_IMPORTED_MODULE_7__ = __webpack_require__(/*! ../hash/index.js */ "./node_modules/ethers/lib.esm/hash/id.js");
/* harmony import */ var _utils_index_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../utils/index.js */ "./node_modules/ethers/lib.esm/utils/properties.js");
/* harmony import */ var _utils_index_js__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ../utils/index.js */ "./node_modules/ethers/lib.esm/utils/errors.js");
/* harmony import */ var _utils_index_js__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! ../utils/index.js */ "./node_modules/ethers/lib.esm/utils/data.js");
/* harmony import */ var _utils_index_js__WEBPACK_IMPORTED_MODULE_9__ = __webpack_require__(/*! ../utils/index.js */ "./node_modules/ethers/lib.esm/utils/maths.js");
/* harmony import */ var _abi_coder_js__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ./abi-coder.js */ "./node_modules/ethers/lib.esm/abi/abi-coder.js");
/* harmony import */ var _coders_abstract_coder_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./coders/abstract-coder.js */ "./node_modules/ethers/lib.esm/abi/coders/abstract-coder.js");
/* harmony import */ var _fragments_js__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./fragments.js */ "./node_modules/ethers/lib.esm/abi/fragments.js");
/* harmony import */ var _typed_js__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! ./typed.js */ "./node_modules/ethers/lib.esm/abi/typed.js");
/**
 *  About Interface
 *
 *  @_subsection api/abi:Interfaces  [interfaces]
 */








class LogDescription {
    fragment;
    name;
    signature;
    topic;
    args;
    constructor(fragment, topic, args) {
        const name = fragment.name, signature = fragment.format();
        (0,_utils_index_js__WEBPACK_IMPORTED_MODULE_1__.defineProperties)(this, {
            fragment, name, signature, topic, args
        });
    }
}
class TransactionDescription {
    fragment;
    name;
    args;
    signature;
    selector;
    value;
    constructor(fragment, selector, args, value) {
        const name = fragment.name, signature = fragment.format();
        (0,_utils_index_js__WEBPACK_IMPORTED_MODULE_1__.defineProperties)(this, {
            fragment, name, args, signature, selector, value
        });
    }
}
class ErrorDescription {
    fragment;
    name;
    args;
    signature;
    selector;
    constructor(fragment, selector, args) {
        const name = fragment.name, signature = fragment.format();
        (0,_utils_index_js__WEBPACK_IMPORTED_MODULE_1__.defineProperties)(this, {
            fragment, name, args, signature, selector
        });
    }
}
class Indexed {
    hash;
    _isIndexed;
    static isIndexed(value) {
        return !!(value && value._isIndexed);
    }
    constructor(hash) {
        (0,_utils_index_js__WEBPACK_IMPORTED_MODULE_1__.defineProperties)(this, { hash, _isIndexed: true });
    }
}
// https://docs.soliditylang.org/en/v0.8.13/control-structures.html?highlight=panic#panic-via-assert-and-error-via-require
const PanicReasons = {
    "0": "generic panic",
    "1": "assert(false)",
    "17": "arithmetic overflow",
    "18": "division or modulo by zero",
    "33": "enum overflow",
    "34": "invalid encoded storage byte array accessed",
    "49": "out-of-bounds array access; popping on an empty array",
    "50": "out-of-bounds access of an array or bytesN",
    "65": "out of memory",
    "81": "uninitialized function",
};
const BuiltinErrors = {
    "0x08c379a0": {
        signature: "Error(string)",
        name: "Error",
        inputs: ["string"],
        reason: (message) => {
            return `reverted with reason string ${JSON.stringify(message)}`;
        }
    },
    "0x4e487b71": {
        signature: "Panic(uint256)",
        name: "Panic",
        inputs: ["uint256"],
        reason: (code) => {
            let reason = "unknown panic code";
            if (code >= 0 && code <= 0xff && PanicReasons[code.toString()]) {
                reason = PanicReasons[code.toString()];
            }
            return `reverted with panic code 0x${code.toString(16)} (${reason})`;
        }
    }
};
/**
 *  An Interface abstracts many of the low-level details for
 *  encoding and decoding the data on the blockchain.
 *
 *  An ABI provides information on how to encode data to send to
 *  a Contract, how to decode the results and events and how to
 *  interpret revert errors.
 *
 *  The ABI can be specified by [any supported format](InterfaceAbi).
 */
class Interface {
    /**
     *  All the Contract ABI members (i.e. methods, events, errors, etc).
     */
    fragments;
    /**
     *  The Contract constructor.
     */
    deploy;
    /**
     *  The Fallback method, if any.
     */
    fallback;
    /**
     *  If receiving ether is supported.
     */
    receive;
    #errors;
    #events;
    #functions;
    //    #structs: Map<string, StructFragment>;
    #abiCoder;
    /**
     *  Create a new Interface for the %%fragments%%.
     */
    constructor(fragments) {
        let abi = [];
        if (typeof (fragments) === "string") {
            abi = JSON.parse(fragments);
        }
        else {
            abi = fragments;
        }
        this.#functions = new Map();
        this.#errors = new Map();
        this.#events = new Map();
        //        this.#structs = new Map();
        const frags = [];
        for (const a of abi) {
            try {
                frags.push(_fragments_js__WEBPACK_IMPORTED_MODULE_2__.Fragment.from(a));
            }
            catch (error) {
                console.log("EE", error);
            }
        }
        (0,_utils_index_js__WEBPACK_IMPORTED_MODULE_1__.defineProperties)(this, {
            fragments: Object.freeze(frags)
        });
        let fallback = null;
        let receive = false;
        this.#abiCoder = this.getAbiCoder();
        // Add all fragments by their signature
        this.fragments.forEach((fragment, index) => {
            let bucket;
            switch (fragment.type) {
                case "constructor":
                    if (this.deploy) {
                        console.log("duplicate definition - constructor");
                        return;
                    }
                    //checkNames(fragment, "input", fragment.inputs);
                    (0,_utils_index_js__WEBPACK_IMPORTED_MODULE_1__.defineProperties)(this, { deploy: fragment });
                    return;
                case "fallback":
                    if (fragment.inputs.length === 0) {
                        receive = true;
                    }
                    else {
                        (0,_utils_index_js__WEBPACK_IMPORTED_MODULE_3__.assertArgument)(!fallback || fragment.payable !== fallback.payable, "conflicting fallback fragments", `fragments[${index}]`, fragment);
                        fallback = fragment;
                        receive = fallback.payable;
                    }
                    return;
                case "function":
                    //checkNames(fragment, "input", fragment.inputs);
                    //checkNames(fragment, "output", (<FunctionFragment>fragment).outputs);
                    bucket = this.#functions;
                    break;
                case "event":
                    //checkNames(fragment, "input", fragment.inputs);
                    bucket = this.#events;
                    break;
                case "error":
                    bucket = this.#errors;
                    break;
                default:
                    return;
            }
            // Two identical entries; ignore it
            const signature = fragment.format();
            if (bucket.has(signature)) {
                return;
            }
            bucket.set(signature, fragment);
        });
        // If we do not have a constructor add a default
        if (!this.deploy) {
            (0,_utils_index_js__WEBPACK_IMPORTED_MODULE_1__.defineProperties)(this, {
                deploy: _fragments_js__WEBPACK_IMPORTED_MODULE_2__.ConstructorFragment.from("constructor()")
            });
        }
        (0,_utils_index_js__WEBPACK_IMPORTED_MODULE_1__.defineProperties)(this, { fallback, receive });
    }
    /**
     *  Returns the entire Human-Readable ABI, as an array of
     *  signatures, optionally as %%minimal%% strings, which
     *  removes parameter names and unneceesary spaces.
     */
    format(minimal) {
        const format = (minimal ? "minimal" : "full");
        const abi = this.fragments.map((f) => f.format(format));
        return abi;
    }
    /**
     *  Return the JSON-encoded ABI. This is the format Solidiy
     *  returns.
     */
    formatJson() {
        const abi = this.fragments.map((f) => f.format("json"));
        // We need to re-bundle the JSON fragments a bit
        return JSON.stringify(abi.map((j) => JSON.parse(j)));
    }
    /**
     *  The ABI coder that will be used to encode and decode binary
     *  data.
     */
    getAbiCoder() {
        return _abi_coder_js__WEBPACK_IMPORTED_MODULE_4__.AbiCoder.defaultAbiCoder();
    }
    // Find a function definition by any means necessary (unless it is ambiguous)
    #getFunction(key, values, forceUnique) {
        // Selector
        if ((0,_utils_index_js__WEBPACK_IMPORTED_MODULE_5__.isHexString)(key)) {
            const selector = key.toLowerCase();
            for (const fragment of this.#functions.values()) {
                if (selector === fragment.selector) {
                    return fragment;
                }
            }
            return null;
        }
        // It is a bare name, look up the function (will return null if ambiguous)
        if (key.indexOf("(") === -1) {
            const matching = [];
            for (const [name, fragment] of this.#functions) {
                if (name.split("(" /* fix:) */)[0] === key) {
                    matching.push(fragment);
                }
            }
            if (values) {
                const lastValue = (values.length > 0) ? values[values.length - 1] : null;
                let valueLength = values.length;
                let allowOptions = true;
                if (_typed_js__WEBPACK_IMPORTED_MODULE_6__.Typed.isTyped(lastValue) && lastValue.type === "overrides") {
                    allowOptions = false;
                    valueLength--;
                }
                // Remove all matches that don't have a compatible length. The args
                // may contain an overrides, so the match may have n or n - 1 parameters
                for (let i = matching.length - 1; i >= 0; i--) {
                    const inputs = matching[i].inputs.length;
                    if (inputs !== valueLength && (!allowOptions || inputs !== valueLength - 1)) {
                        matching.splice(i, 1);
                    }
                }
                // Remove all matches that don't match the Typed signature
                for (let i = matching.length - 1; i >= 0; i--) {
                    const inputs = matching[i].inputs;
                    for (let j = 0; j < values.length; j++) {
                        // Not a typed value
                        if (!_typed_js__WEBPACK_IMPORTED_MODULE_6__.Typed.isTyped(values[j])) {
                            continue;
                        }
                        // We are past the inputs
                        if (j >= inputs.length) {
                            if (values[j].type === "overrides") {
                                continue;
                            }
                            matching.splice(i, 1);
                            break;
                        }
                        // Make sure the value type matches the input type
                        if (values[j].type !== inputs[j].baseType) {
                            matching.splice(i, 1);
                            break;
                        }
                    }
                }
            }
            // We found a single matching signature with an overrides, but the
            // last value is something that cannot possibly be an options
            if (matching.length === 1 && values && values.length !== matching[0].inputs.length) {
                const lastArg = values[values.length - 1];
                if (lastArg == null || Array.isArray(lastArg) || typeof (lastArg) !== "object") {
                    matching.splice(0, 1);
                }
            }
            if (matching.length === 0) {
                return null;
            }
            if (matching.length > 1 && forceUnique) {
                const matchStr = matching.map((m) => JSON.stringify(m.format())).join(", ");
                (0,_utils_index_js__WEBPACK_IMPORTED_MODULE_3__.assertArgument)(false, `ambiguous function description (i.e. matches ${matchStr})`, "key", key);
            }
            return matching[0];
        }
        // Normalize the signature and lookup the function
        const result = this.#functions.get(_fragments_js__WEBPACK_IMPORTED_MODULE_2__.FunctionFragment.from(key).format());
        if (result) {
            return result;
        }
        return null;
    }
    /**
     *  Get the function name for %%key%%, which may be a function selector,
     *  function name or function signature that belongs to the ABI.
     */
    getFunctionName(key) {
        const fragment = this.#getFunction(key, null, false);
        (0,_utils_index_js__WEBPACK_IMPORTED_MODULE_3__.assertArgument)(fragment, "no matching function", "key", key);
        return fragment.name;
    }
    /**
     *  Get the [[FunctionFragment]] for %%key%%, which may be a function
     *  selector, function name or function signature that belongs to the ABI.
     *
     *  If %%values%% is provided, it will use the Typed API to handle
     *  ambiguous cases where multiple functions match by name.
     *
     *  If the %%key%% and %%values%% do not refine to a single function in
     *  the ABI, this will throw.
     */
    getFunction(key, values) {
        return this.#getFunction(key, values || null, true);
    }
    /**
     *  Iterate over all functions, calling %%callback%%, sorted by their name.
     */
    forEachFunction(callback) {
        const names = Array.from(this.#functions.keys());
        names.sort((a, b) => a.localeCompare(b));
        for (let i = 0; i < names.length; i++) {
            const name = names[i];
            callback((this.#functions.get(name)), i);
        }
    }
    // Find an event definition by any means necessary (unless it is ambiguous)
    #getEvent(key, values, forceUnique) {
        // EventTopic
        if ((0,_utils_index_js__WEBPACK_IMPORTED_MODULE_5__.isHexString)(key)) {
            const eventTopic = key.toLowerCase();
            for (const fragment of this.#events.values()) {
                if (eventTopic === fragment.topicHash) {
                    return fragment;
                }
            }
            return null;
        }
        // It is a bare name, look up the function (will return null if ambiguous)
        if (key.indexOf("(") === -1) {
            const matching = [];
            for (const [name, fragment] of this.#events) {
                if (name.split("(" /* fix:) */)[0] === key) {
                    matching.push(fragment);
                }
            }
            if (values) {
                // Remove all matches that don't have a compatible length.
                for (let i = matching.length - 1; i >= 0; i--) {
                    if (matching[i].inputs.length < values.length) {
                        matching.splice(i, 1);
                    }
                }
                // Remove all matches that don't match the Typed signature
                for (let i = matching.length - 1; i >= 0; i--) {
                    const inputs = matching[i].inputs;
                    for (let j = 0; j < values.length; j++) {
                        // Not a typed value
                        if (!_typed_js__WEBPACK_IMPORTED_MODULE_6__.Typed.isTyped(values[j])) {
                            continue;
                        }
                        // Make sure the value type matches the input type
                        if (values[j].type !== inputs[j].baseType) {
                            matching.splice(i, 1);
                            break;
                        }
                    }
                }
            }
            if (matching.length === 0) {
                return null;
            }
            if (matching.length > 1 && forceUnique) {
                const matchStr = matching.map((m) => JSON.stringify(m.format())).join(", ");
                (0,_utils_index_js__WEBPACK_IMPORTED_MODULE_3__.assertArgument)(false, `ambiguous event description (i.e. matches ${matchStr})`, "key", key);
            }
            return matching[0];
        }
        // Normalize the signature and lookup the function
        const result = this.#events.get(_fragments_js__WEBPACK_IMPORTED_MODULE_2__.EventFragment.from(key).format());
        if (result) {
            return result;
        }
        return null;
    }
    /**
     *  Get the event name for %%key%%, which may be a topic hash,
     *  event name or event signature that belongs to the ABI.
     */
    getEventName(key) {
        const fragment = this.#getEvent(key, null, false);
        (0,_utils_index_js__WEBPACK_IMPORTED_MODULE_3__.assertArgument)(fragment, "no matching event", "key", key);
        return fragment.name;
    }
    /**
     *  Get the [[EventFragment]] for %%key%%, which may be a topic hash,
     *  event name or event signature that belongs to the ABI.
     *
     *  If %%values%% is provided, it will use the Typed API to handle
     *  ambiguous cases where multiple events match by name.
     *
     *  If the %%key%% and %%values%% do not refine to a single event in
     *  the ABI, this will throw.
     */
    getEvent(key, values) {
        return this.#getEvent(key, values || null, true);
    }
    /**
     *  Iterate over all events, calling %%callback%%, sorted by their name.
     */
    forEachEvent(callback) {
        const names = Array.from(this.#events.keys());
        names.sort((a, b) => a.localeCompare(b));
        for (let i = 0; i < names.length; i++) {
            const name = names[i];
            callback((this.#events.get(name)), i);
        }
    }
    /**
     *  Get the [[ErrorFragment]] for %%key%%, which may be an error
     *  selector, error name or error signature that belongs to the ABI.
     *
     *  If %%values%% is provided, it will use the Typed API to handle
     *  ambiguous cases where multiple errors match by name.
     *
     *  If the %%key%% and %%values%% do not refine to a single error in
     *  the ABI, this will throw.
     */
    getError(key, values) {
        if ((0,_utils_index_js__WEBPACK_IMPORTED_MODULE_5__.isHexString)(key)) {
            const selector = key.toLowerCase();
            if (BuiltinErrors[selector]) {
                return _fragments_js__WEBPACK_IMPORTED_MODULE_2__.ErrorFragment.from(BuiltinErrors[selector].signature);
            }
            for (const fragment of this.#errors.values()) {
                if (selector === fragment.selector) {
                    return fragment;
                }
            }
            return null;
        }
        // It is a bare name, look up the function (will return null if ambiguous)
        if (key.indexOf("(") === -1) {
            const matching = [];
            for (const [name, fragment] of this.#errors) {
                if (name.split("(" /* fix:) */)[0] === key) {
                    matching.push(fragment);
                }
            }
            if (matching.length === 0) {
                if (key === "Error") {
                    return _fragments_js__WEBPACK_IMPORTED_MODULE_2__.ErrorFragment.from("error Error(string)");
                }
                if (key === "Panic") {
                    return _fragments_js__WEBPACK_IMPORTED_MODULE_2__.ErrorFragment.from("error Panic(uint256)");
                }
                return null;
            }
            else if (matching.length > 1) {
                const matchStr = matching.map((m) => JSON.stringify(m.format())).join(", ");
                (0,_utils_index_js__WEBPACK_IMPORTED_MODULE_3__.assertArgument)(false, `ambiguous error description (i.e. ${matchStr})`, "name", key);
            }
            return matching[0];
        }
        // Normalize the signature and lookup the function
        key = _fragments_js__WEBPACK_IMPORTED_MODULE_2__.ErrorFragment.from(key).format();
        if (key === "Error(string)") {
            return _fragments_js__WEBPACK_IMPORTED_MODULE_2__.ErrorFragment.from("error Error(string)");
        }
        if (key === "Panic(uint256)") {
            return _fragments_js__WEBPACK_IMPORTED_MODULE_2__.ErrorFragment.from("error Panic(uint256)");
        }
        const result = this.#errors.get(key);
        if (result) {
            return result;
        }
        return null;
    }
    /**
     *  Iterate over all errors, calling %%callback%%, sorted by their name.
     */
    forEachError(callback) {
        const names = Array.from(this.#errors.keys());
        names.sort((a, b) => a.localeCompare(b));
        for (let i = 0; i < names.length; i++) {
            const name = names[i];
            callback((this.#errors.get(name)), i);
        }
    }
    // Get the 4-byte selector used by Solidity to identify a function
    /*
getSelector(fragment: ErrorFragment | FunctionFragment): string {
    if (typeof(fragment) === "string") {
        const matches: Array<Fragment> = [ ];

        try { matches.push(this.getFunction(fragment)); } catch (error) { }
        try { matches.push(this.getError(<string>fragment)); } catch (_) { }

        if (matches.length === 0) {
            logger.throwArgumentError("unknown fragment", "key", fragment);
        } else if (matches.length > 1) {
            logger.throwArgumentError("ambiguous fragment matches function and error", "key", fragment);
        }

        fragment = matches[0];
    }

    return dataSlice(id(fragment.format()), 0, 4);
}
    */
    // Get the 32-byte topic hash used by Solidity to identify an event
    /*
    getEventTopic(fragment: EventFragment): string {
        //if (typeof(fragment) === "string") { fragment = this.getEvent(eventFragment); }
        return id(fragment.format());
    }
    */
    _decodeParams(params, data) {
        return this.#abiCoder.decode(params, data);
    }
    _encodeParams(params, values) {
        return this.#abiCoder.encode(params, values);
    }
    /**
     *  Encodes a ``tx.data`` object for deploying the Contract with
     *  the %%values%% as the constructor arguments.
     */
    encodeDeploy(values) {
        return this._encodeParams(this.deploy.inputs, values || []);
    }
    /**
     *  Decodes the result %%data%% (e.g. from an ``eth_call``) for the
     *  specified error (see [[getError]] for valid values for
     *  %%key%%).
     *
     *  Most developers should prefer the [[parseCallResult]] method instead,
     *  which will automatically detect a ``CALL_EXCEPTION`` and throw the
     *  corresponding error.
     */
    decodeErrorResult(fragment, data) {
        if (typeof (fragment) === "string") {
            const f = this.getError(fragment);
            (0,_utils_index_js__WEBPACK_IMPORTED_MODULE_3__.assertArgument)(f, "unknown error", "fragment", fragment);
            fragment = f;
        }
        (0,_utils_index_js__WEBPACK_IMPORTED_MODULE_3__.assertArgument)((0,_utils_index_js__WEBPACK_IMPORTED_MODULE_5__.dataSlice)(data, 0, 4) === fragment.selector, `data signature does not match error ${fragment.name}.`, "data", data);
        return this._decodeParams(fragment.inputs, (0,_utils_index_js__WEBPACK_IMPORTED_MODULE_5__.dataSlice)(data, 4));
    }
    /**
     *  Encodes the transaction revert data for a call result that
     *  reverted from the the Contract with the sepcified %%error%%
     *  (see [[getError]] for valid values for %%fragment%%) with the %%values%%.
     *
     *  This is generally not used by most developers, unless trying to mock
     *  a result from a Contract.
     */
    encodeErrorResult(fragment, values) {
        if (typeof (fragment) === "string") {
            const f = this.getError(fragment);
            (0,_utils_index_js__WEBPACK_IMPORTED_MODULE_3__.assertArgument)(f, "unknown error", "fragment", fragment);
            fragment = f;
        }
        return (0,_utils_index_js__WEBPACK_IMPORTED_MODULE_5__.concat)([
            fragment.selector,
            this._encodeParams(fragment.inputs, values || [])
        ]);
    }
    /**
     *  Decodes the %%data%% from a transaction ``tx.data`` for
     *  the function specified (see [[getFunction]] for valid values
     *  for %%fragment%%).
     *
     *  Most developers should prefer the [[parseTransaction]] method
     *  instead, which will automatically detect the fragment.
     */
    decodeFunctionData(fragment, data) {
        if (typeof (fragment) === "string") {
            const f = this.getFunction(fragment);
            (0,_utils_index_js__WEBPACK_IMPORTED_MODULE_3__.assertArgument)(f, "unknown function", "fragment", fragment);
            fragment = f;
        }
        (0,_utils_index_js__WEBPACK_IMPORTED_MODULE_3__.assertArgument)((0,_utils_index_js__WEBPACK_IMPORTED_MODULE_5__.dataSlice)(data, 0, 4) === fragment.selector, `data signature does not match function ${fragment.name}.`, "data", data);
        return this._decodeParams(fragment.inputs, (0,_utils_index_js__WEBPACK_IMPORTED_MODULE_5__.dataSlice)(data, 4));
    }
    /**
     *  Encodes the ``tx.data`` for a transaction that calls the function
     *  specified (see [[getFunction]] for valid values for %%fragment%%) with
     *  the %%values%%.
     */
    encodeFunctionData(fragment, values) {
        if (typeof (fragment) === "string") {
            const f = this.getFunction(fragment);
            (0,_utils_index_js__WEBPACK_IMPORTED_MODULE_3__.assertArgument)(f, "unknown function", "fragment", fragment);
            fragment = f;
        }
        return (0,_utils_index_js__WEBPACK_IMPORTED_MODULE_5__.concat)([
            fragment.selector,
            this._encodeParams(fragment.inputs, values || [])
        ]);
    }
    /**
     *  Decodes the result %%data%% (e.g. from an ``eth_call``) for the
     *  specified function (see [[getFunction]] for valid values for
     *  %%key%%).
     *
     *  Most developers should prefer the [[parseCallResult]] method instead,
     *  which will automatically detect a ``CALL_EXCEPTION`` and throw the
     *  corresponding error.
     */
    decodeFunctionResult(fragment, data) {
        if (typeof (fragment) === "string") {
            const f = this.getFunction(fragment);
            (0,_utils_index_js__WEBPACK_IMPORTED_MODULE_3__.assertArgument)(f, "unknown function", "fragment", fragment);
            fragment = f;
        }
        let message = "invalid length for result data";
        const bytes = (0,_utils_index_js__WEBPACK_IMPORTED_MODULE_5__.getBytesCopy)(data);
        if ((bytes.length % 32) === 0) {
            try {
                return this.#abiCoder.decode(fragment.outputs, bytes);
            }
            catch (error) {
                message = "could not decode result data";
            }
        }
        // Call returned data with no error, but the data is junk
        (0,_utils_index_js__WEBPACK_IMPORTED_MODULE_3__.assert)(false, message, "BAD_DATA", {
            value: (0,_utils_index_js__WEBPACK_IMPORTED_MODULE_5__.hexlify)(bytes),
            info: { method: fragment.name, signature: fragment.format() }
        });
    }
    makeError(_data, tx) {
        const data = (0,_utils_index_js__WEBPACK_IMPORTED_MODULE_5__.getBytes)(_data, "data");
        const error = _abi_coder_js__WEBPACK_IMPORTED_MODULE_4__.AbiCoder.getBuiltinCallException("call", tx, data);
        // Not a built-in error; try finding a custom error
        const customPrefix = "execution reverted (unknown custom error)";
        if (error.message.startsWith(customPrefix)) {
            const selector = (0,_utils_index_js__WEBPACK_IMPORTED_MODULE_5__.hexlify)(data.slice(0, 4));
            const ef = this.getError(selector);
            if (ef) {
                try {
                    const args = this.#abiCoder.decode(ef.inputs, data.slice(4));
                    error.revert = {
                        name: ef.name, signature: ef.format(), args
                    };
                    error.reason = error.revert.signature;
                    error.message = `execution reverted: ${error.reason}`;
                }
                catch (e) {
                    error.message = `execution reverted (coult not decode custom error)`;
                }
            }
        }
        // Add the invocation, if available
        const parsed = this.parseTransaction(tx);
        if (parsed) {
            error.invocation = {
                method: parsed.name,
                signature: parsed.signature,
                args: parsed.args
            };
        }
        return error;
    }
    /**
     *  Encodes the result data (e.g. from an ``eth_call``) for the
     *  specified function (see [[getFunction]] for valid values
     *  for %%fragment%%) with %%values%%.
     *
     *  This is generally not used by most developers, unless trying to mock
     *  a result from a Contract.
     */
    encodeFunctionResult(fragment, values) {
        if (typeof (fragment) === "string") {
            const f = this.getFunction(fragment);
            (0,_utils_index_js__WEBPACK_IMPORTED_MODULE_3__.assertArgument)(f, "unknown function", "fragment", fragment);
            fragment = f;
        }
        return (0,_utils_index_js__WEBPACK_IMPORTED_MODULE_5__.hexlify)(this.#abiCoder.encode(fragment.outputs, values || []));
    }
    /*
        spelunk(inputs: Array<ParamType>, values: ReadonlyArray<any>, processfunc: (type: string, value: any) => Promise<any>): Promise<Array<any>> {
            const promises: Array<Promise<>> = [ ];
            const process = function(type: ParamType, value: any): any {
                if (type.baseType === "array") {
                    return descend(type.child
                }
                if (type. === "address") {
                }
            };
    
            const descend = function (inputs: Array<ParamType>, values: ReadonlyArray<any>) {
                if (inputs.length !== values.length) { throw new Error("length mismatch"); }
                
            };
    
            const result: Array<any> = [ ];
            values.forEach((value, index) => {
                if (value == null) {
                    topics.push(null);
                } else if (param.baseType === "array" || param.baseType === "tuple") {
                    logger.throwArgumentError("filtering with tuples or arrays not supported", ("contract." + param.name), value);
                } else if (Array.isArray(value)) {
                    topics.push(value.map((value) => encodeTopic(param, value)));
                } else {
                    topics.push(encodeTopic(param, value));
                }
            });
        }
    */
    // Create the filter for the event with search criteria (e.g. for eth_filterLog)
    encodeFilterTopics(fragment, values) {
        if (typeof (fragment) === "string") {
            const f = this.getEvent(fragment);
            (0,_utils_index_js__WEBPACK_IMPORTED_MODULE_3__.assertArgument)(f, "unknown event", "eventFragment", fragment);
            fragment = f;
        }
        (0,_utils_index_js__WEBPACK_IMPORTED_MODULE_3__.assert)(values.length <= fragment.inputs.length, `too many arguments for ${fragment.format()}`, "UNEXPECTED_ARGUMENT", { count: values.length, expectedCount: fragment.inputs.length });
        const topics = [];
        if (!fragment.anonymous) {
            topics.push(fragment.topicHash);
        }
        // @TODO: Use the coders for this; to properly support tuples, etc.
        const encodeTopic = (param, value) => {
            if (param.type === "string") {
                return (0,_hash_index_js__WEBPACK_IMPORTED_MODULE_7__.id)(value);
            }
            else if (param.type === "bytes") {
                return (0,_crypto_index_js__WEBPACK_IMPORTED_MODULE_8__.keccak256)((0,_utils_index_js__WEBPACK_IMPORTED_MODULE_5__.hexlify)(value));
            }
            if (param.type === "bool" && typeof (value) === "boolean") {
                value = (value ? "0x01" : "0x00");
            }
            if (param.type.match(/^u?int/)) {
                value = (0,_utils_index_js__WEBPACK_IMPORTED_MODULE_9__.toBeHex)(value);
            }
            // Check addresses are valid
            if (param.type === "address") {
                this.#abiCoder.encode(["address"], [value]);
            }
            return (0,_utils_index_js__WEBPACK_IMPORTED_MODULE_5__.zeroPadValue)((0,_utils_index_js__WEBPACK_IMPORTED_MODULE_5__.hexlify)(value), 32);
            //@TOOD should probably be return toHex(value, 32)
        };
        values.forEach((value, index) => {
            const param = fragment.inputs[index];
            if (!param.indexed) {
                (0,_utils_index_js__WEBPACK_IMPORTED_MODULE_3__.assertArgument)(value == null, "cannot filter non-indexed parameters; must be null", ("contract." + param.name), value);
                return;
            }
            if (value == null) {
                topics.push(null);
            }
            else if (param.baseType === "array" || param.baseType === "tuple") {
                (0,_utils_index_js__WEBPACK_IMPORTED_MODULE_3__.assertArgument)(false, "filtering with tuples or arrays not supported", ("contract." + param.name), value);
            }
            else if (Array.isArray(value)) {
                topics.push(value.map((value) => encodeTopic(param, value)));
            }
            else {
                topics.push(encodeTopic(param, value));
            }
        });
        // Trim off trailing nulls
        while (topics.length && topics[topics.length - 1] === null) {
            topics.pop();
        }
        return topics;
    }
    encodeEventLog(fragment, values) {
        if (typeof (fragment) === "string") {
            const f = this.getEvent(fragment);
            (0,_utils_index_js__WEBPACK_IMPORTED_MODULE_3__.assertArgument)(f, "unknown event", "eventFragment", fragment);
            fragment = f;
        }
        const topics = [];
        const dataTypes = [];
        const dataValues = [];
        if (!fragment.anonymous) {
            topics.push(fragment.topicHash);
        }
        (0,_utils_index_js__WEBPACK_IMPORTED_MODULE_3__.assertArgument)(values.length === fragment.inputs.length, "event arguments/values mismatch", "values", values);
        fragment.inputs.forEach((param, index) => {
            const value = values[index];
            if (param.indexed) {
                if (param.type === "string") {
                    topics.push((0,_hash_index_js__WEBPACK_IMPORTED_MODULE_7__.id)(value));
                }
                else if (param.type === "bytes") {
                    topics.push((0,_crypto_index_js__WEBPACK_IMPORTED_MODULE_8__.keccak256)(value));
                }
                else if (param.baseType === "tuple" || param.baseType === "array") {
                    // @TODO
                    throw new Error("not implemented");
                }
                else {
                    topics.push(this.#abiCoder.encode([param.type], [value]));
                }
            }
            else {
                dataTypes.push(param);
                dataValues.push(value);
            }
        });
        return {
            data: this.#abiCoder.encode(dataTypes, dataValues),
            topics: topics
        };
    }
    // Decode a filter for the event and the search criteria
    decodeEventLog(fragment, data, topics) {
        if (typeof (fragment) === "string") {
            const f = this.getEvent(fragment);
            (0,_utils_index_js__WEBPACK_IMPORTED_MODULE_3__.assertArgument)(f, "unknown event", "eventFragment", fragment);
            fragment = f;
        }
        if (topics != null && !fragment.anonymous) {
            const eventTopic = fragment.topicHash;
            (0,_utils_index_js__WEBPACK_IMPORTED_MODULE_3__.assertArgument)((0,_utils_index_js__WEBPACK_IMPORTED_MODULE_5__.isHexString)(topics[0], 32) && topics[0].toLowerCase() === eventTopic, "fragment/topic mismatch", "topics[0]", topics[0]);
            topics = topics.slice(1);
        }
        const indexed = [];
        const nonIndexed = [];
        const dynamic = [];
        fragment.inputs.forEach((param, index) => {
            if (param.indexed) {
                if (param.type === "string" || param.type === "bytes" || param.baseType === "tuple" || param.baseType === "array") {
                    indexed.push(_fragments_js__WEBPACK_IMPORTED_MODULE_2__.ParamType.from({ type: "bytes32", name: param.name }));
                    dynamic.push(true);
                }
                else {
                    indexed.push(param);
                    dynamic.push(false);
                }
            }
            else {
                nonIndexed.push(param);
                dynamic.push(false);
            }
        });
        const resultIndexed = (topics != null) ? this.#abiCoder.decode(indexed, (0,_utils_index_js__WEBPACK_IMPORTED_MODULE_5__.concat)(topics)) : null;
        const resultNonIndexed = this.#abiCoder.decode(nonIndexed, data, true);
        //const result: (Array<any> & { [ key: string ]: any }) = [ ];
        const values = [];
        const keys = [];
        let nonIndexedIndex = 0, indexedIndex = 0;
        fragment.inputs.forEach((param, index) => {
            let value = null;
            if (param.indexed) {
                if (resultIndexed == null) {
                    value = new Indexed(null);
                }
                else if (dynamic[index]) {
                    value = new Indexed(resultIndexed[indexedIndex++]);
                }
                else {
                    try {
                        value = resultIndexed[indexedIndex++];
                    }
                    catch (error) {
                        value = error;
                    }
                }
            }
            else {
                try {
                    value = resultNonIndexed[nonIndexedIndex++];
                }
                catch (error) {
                    value = error;
                }
            }
            values.push(value);
            keys.push(param.name || null);
        });
        return _coders_abstract_coder_js__WEBPACK_IMPORTED_MODULE_0__.Result.fromItems(values, keys);
    }
    /**
     *  Parses a transaction, finding the matching function and extracts
     *  the parameter values along with other useful function details.
     *
     *  If the matching function cannot be found, return null.
     */
    parseTransaction(tx) {
        const data = (0,_utils_index_js__WEBPACK_IMPORTED_MODULE_5__.getBytes)(tx.data, "tx.data");
        const value = (0,_utils_index_js__WEBPACK_IMPORTED_MODULE_9__.getBigInt)((tx.value != null) ? tx.value : 0, "tx.value");
        const fragment = this.getFunction((0,_utils_index_js__WEBPACK_IMPORTED_MODULE_5__.hexlify)(data.slice(0, 4)));
        if (!fragment) {
            return null;
        }
        const args = this.#abiCoder.decode(fragment.inputs, data.slice(4));
        return new TransactionDescription(fragment, fragment.selector, args, value);
    }
    parseCallResult(data) {
        throw new Error("@TODO");
    }
    /**
     *  Parses a receipt log, finding the matching event and extracts
     *  the parameter values along with other useful event details.
     *
     *  If the matching event cannot be found, returns null.
     */
    parseLog(log) {
        const fragment = this.getEvent(log.topics[0]);
        if (!fragment || fragment.anonymous) {
            return null;
        }
        // @TODO: If anonymous, and the only method, and the input count matches, should we parse?
        //        Probably not, because just because it is the only event in the ABI does
        //        not mean we have the full ABI; maybe just a fragment?
        return new LogDescription(fragment, fragment.topicHash, this.decodeEventLog(fragment, log.data, log.topics));
    }
    /**
     *  Parses a revert data, finding the matching error and extracts
     *  the parameter values along with other useful error details.
     *
     *  If the matching event cannot be found, returns null.
     */
    parseError(data) {
        const hexData = (0,_utils_index_js__WEBPACK_IMPORTED_MODULE_5__.hexlify)(data);
        const fragment = this.getError((0,_utils_index_js__WEBPACK_IMPORTED_MODULE_5__.dataSlice)(hexData, 0, 4));
        if (!fragment) {
            return null;
        }
        const args = this.#abiCoder.decode(fragment.inputs, (0,_utils_index_js__WEBPACK_IMPORTED_MODULE_5__.dataSlice)(hexData, 4));
        return new ErrorDescription(fragment, fragment.selector, args);
    }
    /**
     *  Creates a new [[Interface]] from the ABI %%value%%.
     *
     *  The %%value%% may be provided as an existing [[Interface]] object,
     *  a JSON-encoded ABI or any Human-Readable ABI format.
     */
    static from(value) {
        // Already an Interface, which is immutable
        if (value instanceof Interface) {
            return value;
        }
        // JSON
        if (typeof (value) === "string") {
            return new Interface(JSON.parse(value));
        }
        // Maybe an interface from an older version, or from a symlinked copy
        if (typeof (value.format) === "function") {
            return new Interface(value.format("json"));
        }
        // Array of fragments
        return new Interface(value);
    }
}
//# sourceMappingURL=interface.js.map

/***/ }),

/***/ "./node_modules/ethers/lib.esm/abi/typed.js":
/*!**************************************************!*\
  !*** ./node_modules/ethers/lib.esm/abi/typed.js ***!
  \**************************************************/
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "Typed": () => (/* binding */ Typed)
/* harmony export */ });
/* harmony import */ var _utils_index_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../utils/index.js */ "./node_modules/ethers/lib.esm/utils/errors.js");
/* harmony import */ var _utils_index_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../utils/index.js */ "./node_modules/ethers/lib.esm/utils/properties.js");
/**
 *  About typed...
 *
 *  @_subsection: api/abi:Typed Values
 */

const _gaurd = {};
function n(value, width) {
    let signed = false;
    if (width < 0) {
        signed = true;
        width *= -1;
    }
    // @TODO: Check range is valid for value
    return new Typed(_gaurd, `${signed ? "" : "u"}int${width}`, value, { signed, width });
}
function b(value, size) {
    // @TODO: Check range is valid for value
    return new Typed(_gaurd, `bytes${(size) ? size : ""}`, value, { size });
}
const _typedSymbol = Symbol.for("_ethers_typed");
class Typed {
    type;
    value;
    #options;
    _typedSymbol;
    constructor(gaurd, type, value, options) {
        if (options == null) {
            options = null;
        }
        (0,_utils_index_js__WEBPACK_IMPORTED_MODULE_0__.assertPrivate)(_gaurd, gaurd, "Typed");
        (0,_utils_index_js__WEBPACK_IMPORTED_MODULE_1__.defineProperties)(this, { _typedSymbol, type, value });
        this.#options = options;
        // Check the value is valid
        this.format();
    }
    format() {
        if (this.type === "array") {
            throw new Error("");
        }
        else if (this.type === "dynamicArray") {
            throw new Error("");
        }
        else if (this.type === "tuple") {
            return `tuple(${this.value.map((v) => v.format()).join(",")})`;
        }
        return this.type;
    }
    defaultValue() {
        return 0;
    }
    minValue() {
        return 0;
    }
    maxValue() {
        return 0;
    }
    isBigInt() {
        return !!(this.type.match(/^u?int[0-9]+$/));
    }
    isData() {
        return this.type.startsWith("bytes");
    }
    isString() {
        return (this.type === "string");
    }
    get tupleName() {
        if (this.type !== "tuple") {
            throw TypeError("not a tuple");
        }
        return this.#options;
    }
    // Returns the length of this type as an array
    // - `null` indicates the length is unforced, it could be dynamic
    // - `-1` indicates the length is dynamic
    // - any other value indicates it is a static array and is its length
    get arrayLength() {
        if (this.type !== "array") {
            throw TypeError("not an array");
        }
        if (this.#options === true) {
            return -1;
        }
        if (this.#options === false) {
            return (this.value).length;
        }
        return null;
    }
    static from(type, value) {
        return new Typed(_gaurd, type, value);
    }
    static uint8(v) { return n(v, 8); }
    static uint16(v) { return n(v, 16); }
    static uint24(v) { return n(v, 24); }
    static uint32(v) { return n(v, 32); }
    static uint40(v) { return n(v, 40); }
    static uint48(v) { return n(v, 48); }
    static uint56(v) { return n(v, 56); }
    static uint64(v) { return n(v, 64); }
    static uint72(v) { return n(v, 72); }
    static uint80(v) { return n(v, 80); }
    static uint88(v) { return n(v, 88); }
    static uint96(v) { return n(v, 96); }
    static uint104(v) { return n(v, 104); }
    static uint112(v) { return n(v, 112); }
    static uint120(v) { return n(v, 120); }
    static uint128(v) { return n(v, 128); }
    static uint136(v) { return n(v, 136); }
    static uint144(v) { return n(v, 144); }
    static uint152(v) { return n(v, 152); }
    static uint160(v) { return n(v, 160); }
    static uint168(v) { return n(v, 168); }
    static uint176(v) { return n(v, 176); }
    static uint184(v) { return n(v, 184); }
    static uint192(v) { return n(v, 192); }
    static uint200(v) { return n(v, 200); }
    static uint208(v) { return n(v, 208); }
    static uint216(v) { return n(v, 216); }
    static uint224(v) { return n(v, 224); }
    static uint232(v) { return n(v, 232); }
    static uint240(v) { return n(v, 240); }
    static uint248(v) { return n(v, 248); }
    static uint256(v) { return n(v, 256); }
    static uint(v) { return n(v, 256); }
    static int8(v) { return n(v, -8); }
    static int16(v) { return n(v, -16); }
    static int24(v) { return n(v, -24); }
    static int32(v) { return n(v, -32); }
    static int40(v) { return n(v, -40); }
    static int48(v) { return n(v, -48); }
    static int56(v) { return n(v, -56); }
    static int64(v) { return n(v, -64); }
    static int72(v) { return n(v, -72); }
    static int80(v) { return n(v, -80); }
    static int88(v) { return n(v, -88); }
    static int96(v) { return n(v, -96); }
    static int104(v) { return n(v, -104); }
    static int112(v) { return n(v, -112); }
    static int120(v) { return n(v, -120); }
    static int128(v) { return n(v, -128); }
    static int136(v) { return n(v, -136); }
    static int144(v) { return n(v, -144); }
    static int152(v) { return n(v, -152); }
    static int160(v) { return n(v, -160); }
    static int168(v) { return n(v, -168); }
    static int176(v) { return n(v, -176); }
    static int184(v) { return n(v, -184); }
    static int192(v) { return n(v, -192); }
    static int200(v) { return n(v, -200); }
    static int208(v) { return n(v, -208); }
    static int216(v) { return n(v, -216); }
    static int224(v) { return n(v, -224); }
    static int232(v) { return n(v, -232); }
    static int240(v) { return n(v, -240); }
    static int248(v) { return n(v, -248); }
    static int256(v) { return n(v, -256); }
    static int(v) { return n(v, -256); }
    static bytes1(v) { return b(v, 1); }
    static bytes2(v) { return b(v, 2); }
    static bytes3(v) { return b(v, 3); }
    static bytes4(v) { return b(v, 4); }
    static bytes5(v) { return b(v, 5); }
    static bytes6(v) { return b(v, 6); }
    static bytes7(v) { return b(v, 7); }
    static bytes8(v) { return b(v, 8); }
    static bytes9(v) { return b(v, 9); }
    static bytes10(v) { return b(v, 10); }
    static bytes11(v) { return b(v, 11); }
    static bytes12(v) { return b(v, 12); }
    static bytes13(v) { return b(v, 13); }
    static bytes14(v) { return b(v, 14); }
    static bytes15(v) { return b(v, 15); }
    static bytes16(v) { return b(v, 16); }
    static bytes17(v) { return b(v, 17); }
    static bytes18(v) { return b(v, 18); }
    static bytes19(v) { return b(v, 19); }
    static bytes20(v) { return b(v, 20); }
    static bytes21(v) { return b(v, 21); }
    static bytes22(v) { return b(v, 22); }
    static bytes23(v) { return b(v, 23); }
    static bytes24(v) { return b(v, 24); }
    static bytes25(v) { return b(v, 25); }
    static bytes26(v) { return b(v, 26); }
    static bytes27(v) { return b(v, 27); }
    static bytes28(v) { return b(v, 28); }
    static bytes29(v) { return b(v, 29); }
    static bytes30(v) { return b(v, 30); }
    static bytes31(v) { return b(v, 31); }
    static bytes32(v) { return b(v, 32); }
    static address(v) { return new Typed(_gaurd, "address", v); }
    static bool(v) { return new Typed(_gaurd, "bool", !!v); }
    static bytes(v) { return new Typed(_gaurd, "bytes", v); }
    static string(v) { return new Typed(_gaurd, "string", v); }
    static array(v, dynamic) {
        throw new Error("not implemented yet");
        return new Typed(_gaurd, "array", v, dynamic);
    }
    static tuple(v, name) {
        throw new Error("not implemented yet");
        return new Typed(_gaurd, "tuple", v, name);
    }
    static overrides(v) {
        return new Typed(_gaurd, "overrides", Object.assign({}, v));
    }
    /**
     *  Returns true only if %%value%% is a [[Typed]] instance.
     */
    static isTyped(value) {
        return (value && value._typedSymbol === _typedSymbol);
    }
    /**
     *  If the value is a [[Typed]] instance, validates the underlying value
     *  and returns it, otherwise returns value directly.
     *
     *  This is useful for functions that with to accept either a [[Typed]]
     *  object or values.
     */
    static dereference(value, type) {
        if (Typed.isTyped(value)) {
            if (value.type !== type) {
                throw new Error(`invalid type: expecetd ${type}, got ${value.type}`);
            }
            return value.value;
        }
        return value;
    }
}
//# sourceMappingURL=typed.js.map

/***/ }),

/***/ "./node_modules/ethers/lib.esm/address/address.js":
/*!********************************************************!*\
  !*** ./node_modules/ethers/lib.esm/address/address.js ***!
  \********************************************************/
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "getAddress": () => (/* binding */ getAddress),
/* harmony export */   "getIcapAddress": () => (/* binding */ getIcapAddress)
/* harmony export */ });
/* harmony import */ var _crypto_index_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../crypto/index.js */ "./node_modules/ethers/lib.esm/crypto/keccak.js");
/* harmony import */ var _utils_index_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../utils/index.js */ "./node_modules/ethers/lib.esm/utils/data.js");
/* harmony import */ var _utils_index_js__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ../utils/index.js */ "./node_modules/ethers/lib.esm/utils/errors.js");


const BN_0 = BigInt(0);
const BN_36 = BigInt(36);
function getChecksumAddress(address) {
    //    if (!isHexString(address, 20)) {
    //        logger.throwArgumentError("invalid address", "address", address);
    //    }
    address = address.toLowerCase();
    const chars = address.substring(2).split("");
    const expanded = new Uint8Array(40);
    for (let i = 0; i < 40; i++) {
        expanded[i] = chars[i].charCodeAt(0);
    }
    const hashed = (0,_utils_index_js__WEBPACK_IMPORTED_MODULE_0__.getBytes)((0,_crypto_index_js__WEBPACK_IMPORTED_MODULE_1__.keccak256)(expanded));
    for (let i = 0; i < 40; i += 2) {
        if ((hashed[i >> 1] >> 4) >= 8) {
            chars[i] = chars[i].toUpperCase();
        }
        if ((hashed[i >> 1] & 0x0f) >= 8) {
            chars[i + 1] = chars[i + 1].toUpperCase();
        }
    }
    return "0x" + chars.join("");
}
// See: https://en.wikipedia.org/wiki/International_Bank_Account_Number
// Create lookup table
const ibanLookup = {};
for (let i = 0; i < 10; i++) {
    ibanLookup[String(i)] = String(i);
}
for (let i = 0; i < 26; i++) {
    ibanLookup[String.fromCharCode(65 + i)] = String(10 + i);
}
// How many decimal digits can we process? (for 64-bit float, this is 15)
// i.e. Math.floor(Math.log10(Number.MAX_SAFE_INTEGER));
const safeDigits = 15;
function ibanChecksum(address) {
    address = address.toUpperCase();
    address = address.substring(4) + address.substring(0, 2) + "00";
    let expanded = address.split("").map((c) => { return ibanLookup[c]; }).join("");
    // Javascript can handle integers safely up to 15 (decimal) digits
    while (expanded.length >= safeDigits) {
        let block = expanded.substring(0, safeDigits);
        expanded = parseInt(block, 10) % 97 + expanded.substring(block.length);
    }
    let checksum = String(98 - (parseInt(expanded, 10) % 97));
    while (checksum.length < 2) {
        checksum = "0" + checksum;
    }
    return checksum;
}
;
const Base36 = (function () {
    ;
    const result = {};
    for (let i = 0; i < 36; i++) {
        const key = "0123456789abcdefghijklmnopqrstuvwxyz"[i];
        result[key] = BigInt(i);
    }
    return result;
})();
function fromBase36(value) {
    value = value.toLowerCase();
    let result = BN_0;
    for (let i = 0; i < value.length; i++) {
        result = result * BN_36 + Base36[value[i]];
    }
    return result;
}
/**
 *  Returns a normalized and checksumed address for %%address%%.
 *  This accepts non-checksum addresses, checksum addresses and
 *  [[getIcapAddress]] formats.
 *
 *  The checksum in Ethereum uses the capitalization (upper-case
 *  vs lower-case) of the characters within an address to encode
 *  its checksum, which offers, on average, a checksum of 15-bits.
 *
 *  If %%address%% contains both upper-case and lower-case, it is
 *  assumed to already be a checksum address and its checksum is
 *  validated, and if the address fails its expected checksum an
 *  error is thrown.
 *
 *  If you wish the checksum of %%address%% to be ignore, it should
 *  be converted to lower-case (i.e. ``.toLowercase()``) before
 *  being passed in. This should be a very rare situation though,
 *  that you wish to bypass the safegaurds in place to protect
 *  against an address that has been incorrectly copied from another
 *  source.
 *
 *  @example:
 *    // Adds the checksum (via upper-casing specific letters)
 *    getAddress("0x8ba1f109551bd432803012645ac136ddd64dba72")
 *    //_result:
 *
 *    // Converts ICAP address and adds checksum
 *    getAddress("XE65GB6LDNXYOFTX0NSV3FUWKOWIXAMJK36");
 *    //_result:
 *
 *    // Throws an error if an address contains mixed case,
 *    // but the checksum fails
 *    getAddress("0x8Ba1f109551bD432803012645Ac136ddd64DBA72")
 *    //_error:
 */
function getAddress(address) {
    (0,_utils_index_js__WEBPACK_IMPORTED_MODULE_2__.assertArgument)(typeof (address) === "string", "invalid address", "address", address);
    if (address.match(/^(0x)?[0-9a-fA-F]{40}$/)) {
        // Missing the 0x prefix
        if (!address.startsWith("0x")) {
            address = "0x" + address;
        }
        const result = getChecksumAddress(address);
        // It is a checksummed address with a bad checksum
        (0,_utils_index_js__WEBPACK_IMPORTED_MODULE_2__.assertArgument)(!address.match(/([A-F].*[a-f])|([a-f].*[A-F])/) || result === address, "bad address checksum", "address", address);
        return result;
    }
    // Maybe ICAP? (we only support direct mode)
    if (address.match(/^XE[0-9]{2}[0-9A-Za-z]{30,31}$/)) {
        // It is an ICAP address with a bad checksum
        (0,_utils_index_js__WEBPACK_IMPORTED_MODULE_2__.assertArgument)(address.substring(2, 4) === ibanChecksum(address), "bad icap checksum", "address", address);
        let result = fromBase36(address.substring(4)).toString(16);
        while (result.length < 40) {
            result = "0" + result;
        }
        return getChecksumAddress("0x" + result);
    }
    (0,_utils_index_js__WEBPACK_IMPORTED_MODULE_2__.assertArgument)(false, "invalid address", "address", address);
}
/**
 *  The [ICAP Address format](link-icap) format is an early checksum
 *  format which attempts to be compatible with the banking
 *  industry [IBAN format](link-wiki-iban] for bank accounts.
 *
 *  It is no longer common or a recommended format.
 *
 *  @example:
 *    getIcapAddress("0x8ba1f109551bd432803012645ac136ddd64dba72");
 *    //_result:
 *
 *    getIcapAddress("XE65GB6LDNXYOFTX0NSV3FUWKOWIXAMJK36");
 *    //_result:
 *
 *    // Throws an error if the ICAP checksum is wrong
 *    getIcapAddress("XE65GB6LDNXYOFTX0NSV3FUWKOWIXAMJK37");
 *    //_error:
 */
function getIcapAddress(address) {
    //let base36 = _base16To36(getAddress(address).substring(2)).toUpperCase();
    let base36 = BigInt(getAddress(address)).toString(36).toUpperCase();
    while (base36.length < 30) {
        base36 = "0" + base36;
    }
    return "XE" + ibanChecksum("XE00" + base36) + base36;
}
//# sourceMappingURL=address.js.map

/***/ }),

/***/ "./node_modules/ethers/lib.esm/address/checks.js":
/*!*******************************************************!*\
  !*** ./node_modules/ethers/lib.esm/address/checks.js ***!
  \*******************************************************/
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "isAddress": () => (/* binding */ isAddress),
/* harmony export */   "isAddressable": () => (/* binding */ isAddressable),
/* harmony export */   "resolveAddress": () => (/* binding */ resolveAddress)
/* harmony export */ });
/* harmony import */ var _utils_index_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../utils/index.js */ "./node_modules/ethers/lib.esm/utils/errors.js");
/* harmony import */ var _address_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./address.js */ "./node_modules/ethers/lib.esm/address/address.js");


/**
 *  Returns true if %%value%% is an object which implements the
 *  [[Addressable]] interface.
 *
 *  @example:
 *    // Wallets and AbstractSigner sub-classes
 *    isAddressable(Wallet.createRandom())
 *    //_result:
 *
 *    // Contracts
 *    contract = new Contract("dai.tokens.ethers.eth", [ ], provider)
 *    isAddressable(contract)
 *    //_result:
 */
function isAddressable(value) {
    return (value && typeof (value.getAddress) === "function");
}
/**
 *  Returns true if %%value%% is a valid address.
 *
 *  @example:
 *    // Valid address
 *    isAddress("0x8ba1f109551bD432803012645Ac136ddd64DBA72")
 *    //_result:
 *
 *    // Valid ICAP address
 *    isAddress("XE65GB6LDNXYOFTX0NSV3FUWKOWIXAMJK36")
 *    //_result:
 *
 *    // Invalid checksum
 *    isAddress("0x8Ba1f109551bD432803012645Ac136ddd64DBa72")
 *    //_result:
 *
 *    // Invalid ICAP checksum
 *    isAddress("0x8Ba1f109551bD432803012645Ac136ddd64DBA72")
 *    //_result:
 *
 *    // Not an address (an ENS name requires a provided and an
 *    // asynchronous API to access)
 *    isAddress("ricmoo.eth")
 *    //_result:
 */
function isAddress(value) {
    try {
        (0,_address_js__WEBPACK_IMPORTED_MODULE_0__.getAddress)(value);
        return true;
    }
    catch (error) { }
    return false;
}
async function checkAddress(target, promise) {
    const result = await promise;
    if (result == null || result === "0x0000000000000000000000000000000000000000") {
        (0,_utils_index_js__WEBPACK_IMPORTED_MODULE_1__.assert)(typeof (target) !== "string", "unconfigured name", "UNCONFIGURED_NAME", { value: target });
        (0,_utils_index_js__WEBPACK_IMPORTED_MODULE_1__.assertArgument)(false, "invalid AddressLike value; did not resolve to a value address", "target", target);
    }
    return (0,_address_js__WEBPACK_IMPORTED_MODULE_0__.getAddress)(result);
}
/**
 *  Resolves to an address for the %%target%%, which may be any
 *  supported address type, an [[Addressable]] or a Promise which
 *  resolves to an address.
 *
 *  If an ENS name is provided, but that name has not been correctly
 *  configured a [[UnconfiguredNameError]] is thrown.
 *
 *  @example:
 *    addr = "0x6B175474E89094C44Da98b954EedeAC495271d0F"
 *
 *    // Addresses are return synchronously
 *    resolveAddress(addr, provider)
 *    //_result:
 *
 *    // Address promises are resolved asynchronously
 *    resolveAddress(Promise.resolve(addr))
 *    //_result:
 *
 *    // ENS names are resolved asynchronously
 *    resolveAddress("dai.tokens.ethers.eth", provider)
 *    //_result:
 *
 *    // Addressable objects are resolved asynchronously
 *    contract = new Contract(addr, [ ])
 *    resolveAddress(contract, provider)
 *    //_result:
 *
 *    // Unconfigured ENS names reject
 *    resolveAddress("nothing-here.ricmoo.eth", provider)
 *    //_error:
 *
 *    // ENS names require a NameResolver object passed in
 *    // (notice the provider was omitted)
 *    resolveAddress("nothing-here.ricmoo.eth")
 *    //_error:
 */
function resolveAddress(target, resolver) {
    if (typeof (target) === "string") {
        if (target.match(/^0x[0-9a-f]{40}$/i)) {
            return (0,_address_js__WEBPACK_IMPORTED_MODULE_0__.getAddress)(target);
        }
        (0,_utils_index_js__WEBPACK_IMPORTED_MODULE_1__.assert)(resolver != null, "ENS resolution requires a provider", "UNSUPPORTED_OPERATION", { operation: "resolveName" });
        return checkAddress(target, resolver.resolveName(target));
    }
    else if (isAddressable(target)) {
        return checkAddress(target, target.getAddress());
    }
    else if (target && typeof (target.then) === "function") {
        return checkAddress(target, target);
    }
    (0,_utils_index_js__WEBPACK_IMPORTED_MODULE_1__.assertArgument)(false, "unsupported addressable value", "target", target);
}
//# sourceMappingURL=checks.js.map

/***/ }),

/***/ "./node_modules/ethers/lib.esm/address/contract-address.js":
/*!*****************************************************************!*\
  !*** ./node_modules/ethers/lib.esm/address/contract-address.js ***!
  \*****************************************************************/
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "getCreate2Address": () => (/* binding */ getCreate2Address),
/* harmony export */   "getCreateAddress": () => (/* binding */ getCreateAddress)
/* harmony export */ });
/* harmony import */ var _crypto_index_js__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ../crypto/index.js */ "./node_modules/ethers/lib.esm/crypto/keccak.js");
/* harmony import */ var _utils_index_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../utils/index.js */ "./node_modules/ethers/lib.esm/utils/maths.js");
/* harmony import */ var _utils_index_js__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ../utils/index.js */ "./node_modules/ethers/lib.esm/utils/data.js");
/* harmony import */ var _utils_index_js__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ../utils/index.js */ "./node_modules/ethers/lib.esm/utils/rlp-encode.js");
/* harmony import */ var _utils_index_js__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! ../utils/index.js */ "./node_modules/ethers/lib.esm/utils/errors.js");
/* harmony import */ var _address_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./address.js */ "./node_modules/ethers/lib.esm/address/address.js");



// http://ethereum.stackexchange.com/questions/760/how-is-the-address-of-an-ethereum-contract-computed
/**
 *  Returns the address that would result from a ``CREATE`` for %%tx%%.
 *
 *  This can be used to compute the address a contract will be
 *  deployed to by an EOA when sending a deployment transaction (i.e.
 *  when the ``to`` address is ``null``).
 *
 *  This can also be used to compute the address a contract will be
 *  deployed to by a contract, by using the contract's address as the
 *  ``to`` and the contract's nonce.
 *
 *  @example
 *    from = "0x8ba1f109551bD432803012645Ac136ddd64DBA72";
 *    nonce = 5;
 *
 *    getCreateAddress({ from, nonce });
 *    //_result:
 */
function getCreateAddress(tx) {
    const from = (0,_address_js__WEBPACK_IMPORTED_MODULE_0__.getAddress)(tx.from);
    const nonce = (0,_utils_index_js__WEBPACK_IMPORTED_MODULE_1__.getBigInt)(tx.nonce, "tx.nonce");
    let nonceHex = nonce.toString(16);
    if (nonceHex === "0") {
        nonceHex = "0x";
    }
    else if (nonceHex.length % 2) {
        nonceHex = "0x0" + nonceHex;
    }
    else {
        nonceHex = "0x" + nonceHex;
    }
    return (0,_address_js__WEBPACK_IMPORTED_MODULE_0__.getAddress)((0,_utils_index_js__WEBPACK_IMPORTED_MODULE_2__.dataSlice)((0,_crypto_index_js__WEBPACK_IMPORTED_MODULE_3__.keccak256)((0,_utils_index_js__WEBPACK_IMPORTED_MODULE_4__.encodeRlp)([from, nonceHex])), 12));
}
/**
 *  Returns the address that would result from a ``CREATE2`` operation
 *  with the given %%from%%, %%salt%% and %%initCodeHash%%.
 *
 *  To compute the %%initCodeHash%% from a contract's init code, use
 *  the [[keccak256]] function.
 *
 *  For a quick overview and example of ``CREATE2``, see [[link-ricmoo-wisps]].
 *
 *  @example
 *    // The address of the contract
 *    from = "0x8ba1f109551bD432803012645Ac136ddd64DBA72"
 *
 *    // The salt
 *    salt = id("HelloWorld")
 *
 *    // The hash of the initCode
 *    initCode = "0x6394198df16000526103ff60206004601c335afa6040516060f3";
 *    initCodeHash = keccak256(initCode)
 *
 *    getCreate2Address(from, salt, initCodeHash)
 *    //_result:
 */
function getCreate2Address(_from, _salt, _initCodeHash) {
    const from = (0,_address_js__WEBPACK_IMPORTED_MODULE_0__.getAddress)(_from);
    const salt = (0,_utils_index_js__WEBPACK_IMPORTED_MODULE_2__.getBytes)(_salt, "salt");
    const initCodeHash = (0,_utils_index_js__WEBPACK_IMPORTED_MODULE_2__.getBytes)(_initCodeHash, "initCodeHash");
    (0,_utils_index_js__WEBPACK_IMPORTED_MODULE_5__.assertArgument)(salt.length === 32, "salt must be 32 bytes", "salt", _salt);
    (0,_utils_index_js__WEBPACK_IMPORTED_MODULE_5__.assertArgument)(initCodeHash.length === 32, "initCodeHash must be 32 bytes", "initCodeHash", _initCodeHash);
    return (0,_address_js__WEBPACK_IMPORTED_MODULE_0__.getAddress)((0,_utils_index_js__WEBPACK_IMPORTED_MODULE_2__.dataSlice)((0,_crypto_index_js__WEBPACK_IMPORTED_MODULE_3__.keccak256)((0,_utils_index_js__WEBPACK_IMPORTED_MODULE_2__.concat)(["0xff", from, salt, initCodeHash])), 12));
}
//# sourceMappingURL=contract-address.js.map

/***/ }),

/***/ "./node_modules/ethers/lib.esm/constants/addresses.js":
/*!************************************************************!*\
  !*** ./node_modules/ethers/lib.esm/constants/addresses.js ***!
  \************************************************************/
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "ZeroAddress": () => (/* binding */ ZeroAddress)
/* harmony export */ });
/**
 *  A constant for the zero address.
 *
 *  (**i.e.** ``"0x0000000000000000000000000000000000000000"``)
 */
const ZeroAddress = "0x0000000000000000000000000000000000000000";
//# sourceMappingURL=addresses.js.map

/***/ }),

/***/ "./node_modules/ethers/lib.esm/constants/hashes.js":
/*!*********************************************************!*\
  !*** ./node_modules/ethers/lib.esm/constants/hashes.js ***!
  \*********************************************************/
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "ZeroHash": () => (/* binding */ ZeroHash)
/* harmony export */ });
/**
 *  A constant for the zero hash.
 *
 *  (**i.e.** ``"0x0000000000000000000000000000000000000000000000000000000000000000"``)
 */
const ZeroHash = "0x0000000000000000000000000000000000000000000000000000000000000000";
//# sourceMappingURL=hashes.js.map

/***/ }),

/***/ "./node_modules/ethers/lib.esm/contract/contract.js":
/*!**********************************************************!*\
  !*** ./node_modules/ethers/lib.esm/contract/contract.js ***!
  \**********************************************************/
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "BaseContract": () => (/* binding */ BaseContract),
/* harmony export */   "Contract": () => (/* binding */ Contract),
/* harmony export */   "copyOverrides": () => (/* binding */ copyOverrides),
/* harmony export */   "resolveArgs": () => (/* binding */ resolveArgs)
/* harmony export */ });
/* harmony import */ var _abi_index_js__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ../abi/index.js */ "./node_modules/ethers/lib.esm/abi/typed.js");
/* harmony import */ var _abi_index_js__WEBPACK_IMPORTED_MODULE_7__ = __webpack_require__(/*! ../abi/index.js */ "./node_modules/ethers/lib.esm/abi/interface.js");
/* harmony import */ var _address_index_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../address/index.js */ "./node_modules/ethers/lib.esm/address/checks.js");
/* harmony import */ var _providers_provider_js__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ../providers/provider.js */ "./node_modules/ethers/lib.esm/providers/provider.js");
/* harmony import */ var _utils_index_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../utils/index.js */ "./node_modules/ethers/lib.esm/utils/properties.js");
/* harmony import */ var _utils_index_js__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ../utils/index.js */ "./node_modules/ethers/lib.esm/utils/errors.js");
/* harmony import */ var _utils_index_js__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! ../utils/index.js */ "./node_modules/ethers/lib.esm/utils/data.js");
/* harmony import */ var _wrappers_js__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! ./wrappers.js */ "./node_modules/ethers/lib.esm/contract/wrappers.js");


// import from provider.ts instead of index.ts to prevent circular dep
// from EtherscanProvider



const BN_0 = BigInt(0);
function canCall(value) {
    return (value && typeof (value.call) === "function");
}
function canEstimate(value) {
    return (value && typeof (value.estimateGas) === "function");
}
function canResolve(value) {
    return (value && typeof (value.resolveName) === "function");
}
function canSend(value) {
    return (value && typeof (value.sendTransaction) === "function");
}
class PreparedTopicFilter {
    #filter;
    fragment;
    constructor(contract, fragment, args) {
        (0,_utils_index_js__WEBPACK_IMPORTED_MODULE_0__.defineProperties)(this, { fragment });
        if (fragment.inputs.length < args.length) {
            throw new Error("too many arguments");
        }
        // Recursively descend into args and resolve any addresses
        const runner = getRunner(contract.runner, "resolveName");
        const resolver = canResolve(runner) ? runner : null;
        this.#filter = (async function () {
            const resolvedArgs = await Promise.all(fragment.inputs.map((param, index) => {
                const arg = args[index];
                if (arg == null) {
                    return null;
                }
                return param.walkAsync(args[index], (type, value) => {
                    if (type === "address") {
                        return (0,_address_index_js__WEBPACK_IMPORTED_MODULE_1__.resolveAddress)(value, resolver);
                    }
                    return value;
                });
            }));
            return contract.interface.encodeFilterTopics(fragment, resolvedArgs);
        })();
    }
    getTopicFilter() {
        return this.#filter;
    }
}
// A = Arguments passed in as a tuple
// R = The result type of the call (i.e. if only one return type,
//     the qualified type, otherwise Result)
// D = The type the default call will return (i.e. R for view/pure,
//     TransactionResponse otherwise)
//export interface ContractMethod<A extends Array<any> = Array<any>, R = any, D extends R | ContractTransactionResponse = ContractTransactionResponse> {
function _WrappedMethodBase() {
    return Function;
}
function getRunner(value, feature) {
    if (value == null) {
        return null;
    }
    if (typeof (value[feature]) === "function") {
        return value;
    }
    if (value.provider && typeof (value.provider[feature]) === "function") {
        return value.provider;
    }
    return null;
}
function getProvider(value) {
    if (value == null) {
        return null;
    }
    return value.provider || null;
}
/**
 *  @_ignore:
 */
async function copyOverrides(arg, allowed) {
    // Create a shallow copy (we'll deep-ify anything needed during normalizing)
    const overrides = (0,_providers_provider_js__WEBPACK_IMPORTED_MODULE_2__.copyRequest)(_abi_index_js__WEBPACK_IMPORTED_MODULE_3__.Typed.dereference(arg, "overrides"));
    (0,_utils_index_js__WEBPACK_IMPORTED_MODULE_4__.assertArgument)(overrides.to == null || (allowed || []).indexOf("to") >= 0, "cannot override to", "overrides.to", overrides.to);
    (0,_utils_index_js__WEBPACK_IMPORTED_MODULE_4__.assertArgument)(overrides.data == null || (allowed || []).indexOf("data") >= 0, "cannot override data", "overrides.data", overrides.data);
    // Resolve any from
    if (overrides.from) {
        overrides.from = await (0,_address_index_js__WEBPACK_IMPORTED_MODULE_1__.resolveAddress)(overrides.from);
    }
    return overrides;
}
/**
 *  @_ignore:
 */
async function resolveArgs(_runner, inputs, args) {
    // Recursively descend into args and resolve any addresses
    const runner = getRunner(_runner, "resolveName");
    const resolver = canResolve(runner) ? runner : null;
    return await Promise.all(inputs.map((param, index) => {
        return param.walkAsync(args[index], (type, value) => {
            value = _abi_index_js__WEBPACK_IMPORTED_MODULE_3__.Typed.dereference(value, type);
            if (type === "address") {
                return (0,_address_index_js__WEBPACK_IMPORTED_MODULE_1__.resolveAddress)(value, resolver);
            }
            return value;
        });
    }));
}
class WrappedFallback {
    _contract;
    constructor(contract) {
        (0,_utils_index_js__WEBPACK_IMPORTED_MODULE_0__.defineProperties)(this, { _contract: contract });
        const proxy = new Proxy(this, {
            // Perform send when called
            apply: async (target, thisArg, args) => {
                return await target.send(...args);
            },
        });
        return proxy;
    }
    async populateTransaction(overrides) {
        // If an overrides was passed in, copy it and normalize the values
        const tx = (await copyOverrides(overrides, ["data"]));
        tx.to = await this._contract.getAddress();
        const iface = this._contract.interface;
        // Only allow payable contracts to set non-zero value
        const payable = iface.receive || (iface.fallback && iface.fallback.payable);
        (0,_utils_index_js__WEBPACK_IMPORTED_MODULE_4__.assertArgument)(payable || (tx.value || BN_0) === BN_0, "cannot send value to non-payable contract", "overrides.value", tx.value);
        // Only allow fallback contracts to set non-empty data
        (0,_utils_index_js__WEBPACK_IMPORTED_MODULE_4__.assertArgument)(iface.fallback || (tx.data || "0x") === "0x", "cannot send data to receive-only contract", "overrides.data", tx.data);
        return tx;
    }
    async staticCall(overrides) {
        const runner = getRunner(this._contract.runner, "call");
        (0,_utils_index_js__WEBPACK_IMPORTED_MODULE_4__.assert)(canCall(runner), "contract runner does not support calling", "UNSUPPORTED_OPERATION", { operation: "call" });
        const tx = await this.populateTransaction(overrides);
        try {
            return await runner.call(tx);
        }
        catch (error) {
            if ((0,_utils_index_js__WEBPACK_IMPORTED_MODULE_4__.isCallException)(error) && error.data) {
                throw this._contract.interface.makeError(error.data, tx);
            }
            throw error;
        }
    }
    async send(overrides) {
        const runner = this._contract.runner;
        (0,_utils_index_js__WEBPACK_IMPORTED_MODULE_4__.assert)(canSend(runner), "contract runner does not support sending transactions", "UNSUPPORTED_OPERATION", { operation: "sendTransaction" });
        const tx = await runner.sendTransaction(await this.populateTransaction(overrides));
        const provider = getProvider(this._contract.runner);
        // @TODO: the provider can be null; make a custom dummy provider that will throw a
        // meaningful error
        return new _wrappers_js__WEBPACK_IMPORTED_MODULE_5__.ContractTransactionResponse(this._contract.interface, provider, tx);
    }
    async estimateGas(overrides) {
        const runner = getRunner(this._contract.runner, "estimateGas");
        (0,_utils_index_js__WEBPACK_IMPORTED_MODULE_4__.assert)(canEstimate(runner), "contract runner does not support gas estimation", "UNSUPPORTED_OPERATION", { operation: "estimateGas" });
        return await runner.estimateGas(await this.populateTransaction(overrides));
    }
}
class WrappedMethod extends _WrappedMethodBase() {
    name = ""; // Investigate!
    _contract;
    _key;
    constructor(contract, key) {
        super();
        (0,_utils_index_js__WEBPACK_IMPORTED_MODULE_0__.defineProperties)(this, {
            name: contract.interface.getFunctionName(key),
            _contract: contract, _key: key
        });
        const proxy = new Proxy(this, {
            // Perform the default operation for this fragment type
            apply: async (target, thisArg, args) => {
                const fragment = target.getFragment(...args);
                if (fragment.constant) {
                    return await target.staticCall(...args);
                }
                return await target.send(...args);
            },
        });
        return proxy;
    }
    // Only works on non-ambiguous keys (refined fragment is always non-ambiguous)
    get fragment() {
        const fragment = this._contract.interface.getFunction(this._key);
        (0,_utils_index_js__WEBPACK_IMPORTED_MODULE_4__.assert)(fragment, "no matching fragment", "UNSUPPORTED_OPERATION", {
            operation: "fragment"
        });
        return fragment;
    }
    getFragment(...args) {
        const fragment = this._contract.interface.getFunction(this._key, args);
        (0,_utils_index_js__WEBPACK_IMPORTED_MODULE_4__.assert)(fragment, "no matching fragment", "UNSUPPORTED_OPERATION", {
            operation: "fragment"
        });
        return fragment;
    }
    async populateTransaction(...args) {
        const fragment = this.getFragment(...args);
        // If an overrides was passed in, copy it and normalize the values
        let overrides = {};
        if (fragment.inputs.length + 1 === args.length) {
            overrides = await copyOverrides(args.pop());
        }
        if (fragment.inputs.length !== args.length) {
            throw new Error("internal error: fragment inputs doesn't match arguments; should not happen");
        }
        const resolvedArgs = await resolveArgs(this._contract.runner, fragment.inputs, args);
        return Object.assign({}, overrides, await (0,_utils_index_js__WEBPACK_IMPORTED_MODULE_0__.resolveProperties)({
            to: this._contract.getAddress(),
            data: this._contract.interface.encodeFunctionData(fragment, resolvedArgs)
        }));
    }
    async staticCall(...args) {
        const result = await this.staticCallResult(...args);
        if (result.length === 1) {
            return result[0];
        }
        return result;
    }
    async send(...args) {
        const runner = this._contract.runner;
        (0,_utils_index_js__WEBPACK_IMPORTED_MODULE_4__.assert)(canSend(runner), "contract runner does not support sending transactions", "UNSUPPORTED_OPERATION", { operation: "sendTransaction" });
        const tx = await runner.sendTransaction(await this.populateTransaction(...args));
        const provider = getProvider(this._contract.runner);
        // @TODO: the provider can be null; make a custom dummy provider that will throw a
        // meaningful error
        return new _wrappers_js__WEBPACK_IMPORTED_MODULE_5__.ContractTransactionResponse(this._contract.interface, provider, tx);
    }
    async estimateGas(...args) {
        const runner = getRunner(this._contract.runner, "estimateGas");
        (0,_utils_index_js__WEBPACK_IMPORTED_MODULE_4__.assert)(canEstimate(runner), "contract runner does not support gas estimation", "UNSUPPORTED_OPERATION", { operation: "estimateGas" });
        return await runner.estimateGas(await this.populateTransaction(...args));
    }
    async staticCallResult(...args) {
        const runner = getRunner(this._contract.runner, "call");
        (0,_utils_index_js__WEBPACK_IMPORTED_MODULE_4__.assert)(canCall(runner), "contract runner does not support calling", "UNSUPPORTED_OPERATION", { operation: "call" });
        const tx = await this.populateTransaction(...args);
        let result = "0x";
        try {
            result = await runner.call(tx);
        }
        catch (error) {
            if ((0,_utils_index_js__WEBPACK_IMPORTED_MODULE_4__.isCallException)(error) && error.data) {
                throw this._contract.interface.makeError(error.data, tx);
            }
            throw error;
        }
        const fragment = this.getFragment(...args);
        return this._contract.interface.decodeFunctionResult(fragment, result);
    }
}
function _WrappedEventBase() {
    return Function;
}
class WrappedEvent extends _WrappedEventBase() {
    name = ""; // @TODO: investigate 
    _contract;
    _key;
    constructor(contract, key) {
        super();
        (0,_utils_index_js__WEBPACK_IMPORTED_MODULE_0__.defineProperties)(this, {
            name: contract.interface.getEventName(key),
            _contract: contract, _key: key
        });
        return new Proxy(this, {
            // Perform the default operation for this fragment type
            apply: (target, thisArg, args) => {
                return new PreparedTopicFilter(contract, target.getFragment(...args), args);
            },
        });
    }
    // Only works on non-ambiguous keys
    get fragment() {
        const fragment = this._contract.interface.getEvent(this._key);
        (0,_utils_index_js__WEBPACK_IMPORTED_MODULE_4__.assert)(fragment, "no matching fragment", "UNSUPPORTED_OPERATION", {
            operation: "fragment"
        });
        return fragment;
    }
    getFragment(...args) {
        const fragment = this._contract.interface.getEvent(this._key, args);
        (0,_utils_index_js__WEBPACK_IMPORTED_MODULE_4__.assert)(fragment, "no matching fragment", "UNSUPPORTED_OPERATION", {
            operation: "fragment"
        });
        return fragment;
    }
}
;
// The combination of TypeScrype, Private Fields and Proxies makes
// the world go boom; so we hide variables with some trickery keeping
// a symbol attached to each BaseContract which its sub-class (even
// via a Proxy) can reach and use to look up its internal values.
const internal = Symbol.for("_ethersInternal_contract");
const internalValues = new WeakMap();
function setInternal(contract, values) {
    internalValues.set(contract[internal], values);
}
function getInternal(contract) {
    return internalValues.get(contract[internal]);
}
function isDeferred(value) {
    return (value && typeof (value) === "object" && ("getTopicFilter" in value) &&
        (typeof (value.getTopicFilter) === "function") && value.fragment);
}
async function getSubInfo(contract, event) {
    let topics;
    let fragment = null;
    // Convert named events to topicHash and get the fragment for
    // events which need deconstructing.
    if (Array.isArray(event)) {
        const topicHashify = function (name) {
            if ((0,_utils_index_js__WEBPACK_IMPORTED_MODULE_6__.isHexString)(name, 32)) {
                return name;
            }
            const fragment = contract.interface.getEvent(name);
            (0,_utils_index_js__WEBPACK_IMPORTED_MODULE_4__.assertArgument)(fragment, "unknown fragment", "name", name);
            return fragment.topicHash;
        };
        // Array of Topics and Names; e.g. `[ "0x1234...89ab", "Transfer(address)" ]`
        topics = event.map((e) => {
            if (e == null) {
                return null;
            }
            if (Array.isArray(e)) {
                return e.map(topicHashify);
            }
            return topicHashify(e);
        });
    }
    else if (event === "*") {
        topics = [null];
    }
    else if (typeof (event) === "string") {
        if ((0,_utils_index_js__WEBPACK_IMPORTED_MODULE_6__.isHexString)(event, 32)) {
            // Topic Hash
            topics = [event];
        }
        else {
            // Name or Signature; e.g. `"Transfer", `"Transfer(address)"`
            fragment = contract.interface.getEvent(event);
            (0,_utils_index_js__WEBPACK_IMPORTED_MODULE_4__.assertArgument)(fragment, "unknown fragment", "event", event);
            topics = [fragment.topicHash];
        }
    }
    else if (isDeferred(event)) {
        // Deferred Topic Filter; e.g. `contract.filter.Transfer(from)`
        topics = await event.getTopicFilter();
    }
    else if ("fragment" in event) {
        // ContractEvent; e.g. `contract.filter.Transfer`
        fragment = event.fragment;
        topics = [fragment.topicHash];
    }
    else {
        (0,_utils_index_js__WEBPACK_IMPORTED_MODULE_4__.assertArgument)(false, "unknown event name", "event", event);
    }
    // Normalize topics and sort TopicSets
    topics = topics.map((t) => {
        if (t == null) {
            return null;
        }
        if (Array.isArray(t)) {
            const items = Array.from(new Set(t.map((t) => t.toLowerCase())).values());
            if (items.length === 1) {
                return items[0];
            }
            items.sort();
            return items;
        }
        return t.toLowerCase();
    });
    const tag = topics.map((t) => {
        if (t == null) {
            return "null";
        }
        if (Array.isArray(t)) {
            return t.join("|");
        }
        return t;
    }).join("&");
    return { fragment, tag, topics };
}
async function hasSub(contract, event) {
    const { subs } = getInternal(contract);
    return subs.get((await getSubInfo(contract, event)).tag) || null;
}
async function getSub(contract, operation, event) {
    // Make sure our runner can actually subscribe to events
    const provider = getProvider(contract.runner);
    (0,_utils_index_js__WEBPACK_IMPORTED_MODULE_4__.assert)(provider, "contract runner does not support subscribing", "UNSUPPORTED_OPERATION", { operation });
    const { fragment, tag, topics } = await getSubInfo(contract, event);
    const { addr, subs } = getInternal(contract);
    let sub = subs.get(tag);
    if (!sub) {
        const address = (addr ? addr : contract);
        const filter = { address, topics };
        const listener = (log) => {
            let foundFragment = fragment;
            if (foundFragment == null) {
                try {
                    foundFragment = contract.interface.getEvent(log.topics[0]);
                }
                catch (error) { }
            }
            // If fragment is null, we do not deconstruct the args to emit
            if (foundFragment) {
                const _foundFragment = foundFragment;
                const args = fragment ? contract.interface.decodeEventLog(fragment, log.data, log.topics) : [];
                emit(contract, event, args, (listener) => {
                    return new _wrappers_js__WEBPACK_IMPORTED_MODULE_5__.ContractEventPayload(contract, listener, event, _foundFragment, log);
                });
            }
            else {
                emit(contract, event, [], (listener) => {
                    return new _wrappers_js__WEBPACK_IMPORTED_MODULE_5__.ContractUnknownEventPayload(contract, listener, event, log);
                });
            }
        };
        let starting = [];
        const start = () => {
            if (starting.length) {
                return;
            }
            starting.push(provider.on(filter, listener));
        };
        const stop = async () => {
            if (starting.length == 0) {
                return;
            }
            let started = starting;
            starting = [];
            await Promise.all(started);
            provider.off(filter, listener);
        };
        sub = { tag, listeners: [], start, stop };
        subs.set(tag, sub);
    }
    return sub;
}
// We use this to ensure one emit resolves before firing the next to
// ensure correct ordering (note this cannot throw and just adds the
// notice to the event queu using setTimeout).
let lastEmit = Promise.resolve();
async function _emit(contract, event, args, payloadFunc) {
    await lastEmit;
    const sub = await hasSub(contract, event);
    if (!sub) {
        return false;
    }
    const count = sub.listeners.length;
    sub.listeners = sub.listeners.filter(({ listener, once }) => {
        const passArgs = Array.from(args);
        if (payloadFunc) {
            passArgs.push(payloadFunc(once ? null : listener));
        }
        try {
            listener.call(contract, ...passArgs);
        }
        catch (error) { }
        return !once;
    });
    return (count > 0);
}
async function emit(contract, event, args, payloadFunc) {
    try {
        await lastEmit;
    }
    catch (error) { }
    const resultPromise = _emit(contract, event, args, payloadFunc);
    lastEmit = resultPromise;
    return await resultPromise;
}
const passProperties = ["then"];
class BaseContract {
    target;
    interface;
    runner;
    filters;
    [internal];
    fallback;
    constructor(target, abi, runner, _deployTx) {
        if (runner == null) {
            runner = null;
        }
        const iface = _abi_index_js__WEBPACK_IMPORTED_MODULE_7__.Interface.from(abi);
        (0,_utils_index_js__WEBPACK_IMPORTED_MODULE_0__.defineProperties)(this, { target, runner, interface: iface });
        Object.defineProperty(this, internal, { value: {} });
        let addrPromise;
        let addr = null;
        let deployTx = null;
        if (_deployTx) {
            const provider = getProvider(runner);
            // @TODO: the provider can be null; make a custom dummy provider that will throw a
            // meaningful error
            deployTx = new _wrappers_js__WEBPACK_IMPORTED_MODULE_5__.ContractTransactionResponse(this.interface, provider, _deployTx);
        }
        let subs = new Map();
        // Resolve the target as the address
        if (typeof (target) === "string") {
            if ((0,_utils_index_js__WEBPACK_IMPORTED_MODULE_6__.isHexString)(target)) {
                addr = target;
                addrPromise = Promise.resolve(target);
            }
            else {
                const resolver = getRunner(runner, "resolveName");
                if (!canResolve(resolver)) {
                    throw (0,_utils_index_js__WEBPACK_IMPORTED_MODULE_4__.makeError)("contract runner does not support name resolution", "UNSUPPORTED_OPERATION", {
                        operation: "resolveName"
                    });
                }
                addrPromise = resolver.resolveName(target).then((addr) => {
                    if (addr == null) {
                        throw new Error("TODO");
                    }
                    getInternal(this).addr = addr;
                    return addr;
                });
            }
        }
        else {
            addrPromise = target.getAddress().then((addr) => {
                if (addr == null) {
                    throw new Error("TODO");
                }
                getInternal(this).addr = addr;
                return addr;
            });
        }
        // Set our private values
        setInternal(this, { addrPromise, addr, deployTx, subs });
        // Add the event filters
        const filters = new Proxy({}, {
            get: (target, _prop, receiver) => {
                // Pass important checks (like `then` for Promise) through
                if (passProperties.indexOf(_prop) >= 0) {
                    return Reflect.get(target, _prop, receiver);
                }
                const prop = String(_prop);
                const result = this.getEvent(prop);
                if (result) {
                    return result;
                }
                throw new Error(`unknown contract event: ${prop}`);
            }
        });
        (0,_utils_index_js__WEBPACK_IMPORTED_MODULE_0__.defineProperties)(this, { filters });
        (0,_utils_index_js__WEBPACK_IMPORTED_MODULE_0__.defineProperties)(this, {
            fallback: ((iface.receive || iface.fallback) ? (new WrappedFallback(this)) : null)
        });
        // Return a Proxy that will respond to functions
        return new Proxy(this, {
            get: (target, _prop, receiver) => {
                if (_prop in target || passProperties.indexOf(_prop) >= 0) {
                    return Reflect.get(target, _prop, receiver);
                }
                const prop = String(_prop);
                const result = target.getFunction(prop);
                if (result) {
                    return result;
                }
                throw new Error(`unknown contract method: ${prop}`);
            }
        });
    }
    connect(runner) {
        return new BaseContract(this.target, this.interface, runner);
    }
    async getAddress() { return await getInternal(this).addrPromise; }
    async getDeployedCode() {
        const provider = getProvider(this.runner);
        (0,_utils_index_js__WEBPACK_IMPORTED_MODULE_4__.assert)(provider, "runner does not support .provider", "UNSUPPORTED_OPERATION", { operation: "getDeployedCode" });
        const code = await provider.getCode(await this.getAddress());
        if (code === "0x") {
            return null;
        }
        return code;
    }
    async waitForDeployment() {
        // We have the deployement transaction; just use that (throws if deployement fails)
        const deployTx = this.deploymentTransaction();
        if (deployTx) {
            await deployTx.wait();
            return this;
        }
        // Check for code
        const code = await this.getDeployedCode();
        if (code != null) {
            return this;
        }
        // Make sure we can subscribe to a provider event
        const provider = getProvider(this.runner);
        (0,_utils_index_js__WEBPACK_IMPORTED_MODULE_4__.assert)(provider != null, "contract runner does not support .provider", "UNSUPPORTED_OPERATION", { operation: "waitForDeployment" });
        return new Promise((resolve, reject) => {
            const checkCode = async () => {
                try {
                    const code = await this.getDeployedCode();
                    if (code != null) {
                        return resolve(this);
                    }
                    provider.once("block", checkCode);
                }
                catch (error) {
                    reject(error);
                }
            };
            checkCode();
        });
    }
    deploymentTransaction() {
        return getInternal(this).deployTx;
    }
    getFunction(key) {
        if (typeof (key) !== "string") {
            key = key.format();
        }
        return (new WrappedMethod(this, key));
    }
    getEvent(key) {
        if (typeof (key) !== "string") {
            key = key.format();
        }
        return (new WrappedEvent(this, key));
    }
    async queryTransaction(hash) {
        // Is this useful?
        throw new Error("@TODO");
    }
    async queryFilter(event, fromBlock, toBlock) {
        if (fromBlock == null) {
            fromBlock = 0;
        }
        if (toBlock == null) {
            toBlock = "latest";
        }
        const { addr, addrPromise } = getInternal(this);
        const address = (addr ? addr : (await addrPromise));
        const { fragment, topics } = await getSubInfo(this, event);
        const filter = { address, topics, fromBlock, toBlock };
        const provider = getProvider(this.runner);
        (0,_utils_index_js__WEBPACK_IMPORTED_MODULE_4__.assert)(provider, "contract runner does not have a provider", "UNSUPPORTED_OPERATION", { operation: "queryFilter" });
        return (await provider.getLogs(filter)).map((log) => {
            let foundFragment = fragment;
            if (foundFragment == null) {
                try {
                    foundFragment = this.interface.getEvent(log.topics[0]);
                }
                catch (error) { }
            }
            if (foundFragment) {
                return new _wrappers_js__WEBPACK_IMPORTED_MODULE_5__.EventLog(log, this.interface, foundFragment);
            }
            else {
                return new _providers_provider_js__WEBPACK_IMPORTED_MODULE_2__.Log(log, provider);
            }
        });
    }
    async on(event, listener) {
        const sub = await getSub(this, "on", event);
        sub.listeners.push({ listener, once: false });
        sub.start();
        return this;
    }
    async once(event, listener) {
        const sub = await getSub(this, "once", event);
        sub.listeners.push({ listener, once: true });
        sub.start();
        return this;
    }
    async emit(event, ...args) {
        return await emit(this, event, args, null);
    }
    async listenerCount(event) {
        if (event) {
            const sub = await hasSub(this, event);
            if (!sub) {
                return 0;
            }
            return sub.listeners.length;
        }
        const { subs } = getInternal(this);
        let total = 0;
        for (const { listeners } of subs.values()) {
            total += listeners.length;
        }
        return total;
    }
    async listeners(event) {
        if (event) {
            const sub = await hasSub(this, event);
            if (!sub) {
                return [];
            }
            return sub.listeners.map(({ listener }) => listener);
        }
        const { subs } = getInternal(this);
        let result = [];
        for (const { listeners } of subs.values()) {
            result = result.concat(listeners.map(({ listener }) => listener));
        }
        return result;
    }
    async off(event, listener) {
        const sub = await hasSub(this, event);
        if (!sub) {
            return this;
        }
        if (listener) {
            const index = sub.listeners.map(({ listener }) => listener).indexOf(listener);
            if (index >= 0) {
                sub.listeners.splice(index, 1);
            }
        }
        if (listener == null || sub.listeners.length === 0) {
            sub.stop();
            getInternal(this).subs.delete(sub.tag);
        }
        return this;
    }
    async removeAllListeners(event) {
        if (event) {
            const sub = await hasSub(this, event);
            if (!sub) {
                return this;
            }
            sub.stop();
            getInternal(this).subs.delete(sub.tag);
        }
        else {
            const { subs } = getInternal(this);
            for (const { tag, stop } of subs.values()) {
                stop();
                subs.delete(tag);
            }
        }
        return this;
    }
    // Alias for "on"
    async addListener(event, listener) {
        return await this.on(event, listener);
    }
    // Alias for "off"
    async removeListener(event, listener) {
        return await this.off(event, listener);
    }
    static buildClass(abi) {
        class CustomContract extends BaseContract {
            constructor(address, runner = null) {
                super(address, abi, runner);
            }
        }
        return CustomContract;
    }
    ;
    static from(target, abi, runner) {
        if (runner == null) {
            runner = null;
        }
        const contract = new this(target, abi, runner);
        return contract;
    }
}
function _ContractBase() {
    return BaseContract;
}
class Contract extends _ContractBase() {
}
//# sourceMappingURL=contract.js.map

/***/ }),

/***/ "./node_modules/ethers/lib.esm/contract/wrappers.js":
/*!**********************************************************!*\
  !*** ./node_modules/ethers/lib.esm/contract/wrappers.js ***!
  \**********************************************************/
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "ContractEventPayload": () => (/* binding */ ContractEventPayload),
/* harmony export */   "ContractTransactionReceipt": () => (/* binding */ ContractTransactionReceipt),
/* harmony export */   "ContractTransactionResponse": () => (/* binding */ ContractTransactionResponse),
/* harmony export */   "ContractUnknownEventPayload": () => (/* binding */ ContractUnknownEventPayload),
/* harmony export */   "EventLog": () => (/* binding */ EventLog)
/* harmony export */ });
/* harmony import */ var _providers_provider_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../providers/provider.js */ "./node_modules/ethers/lib.esm/providers/provider.js");
/* harmony import */ var _utils_index_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../utils/index.js */ "./node_modules/ethers/lib.esm/utils/properties.js");
/* harmony import */ var _utils_index_js__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ../utils/index.js */ "./node_modules/ethers/lib.esm/utils/events.js");
// import from provider.ts instead of index.ts to prevent circular dep
// from EtherscanProvider


class EventLog extends _providers_provider_js__WEBPACK_IMPORTED_MODULE_0__.Log {
    interface;
    fragment;
    args;
    constructor(log, iface, fragment) {
        super(log, log.provider);
        const args = iface.decodeEventLog(fragment, log.data, log.topics);
        (0,_utils_index_js__WEBPACK_IMPORTED_MODULE_1__.defineProperties)(this, { args, fragment, interface: iface });
    }
    get eventName() { return this.fragment.name; }
    get eventSignature() { return this.fragment.format(); }
}
class ContractTransactionReceipt extends _providers_provider_js__WEBPACK_IMPORTED_MODULE_0__.TransactionReceipt {
    #interface;
    constructor(iface, provider, tx) {
        super(tx, provider);
        this.#interface = iface;
    }
    get logs() {
        return super.logs.map((log) => {
            const fragment = log.topics.length ? this.#interface.getEvent(log.topics[0]) : null;
            if (fragment) {
                return new EventLog(log, this.#interface, fragment);
            }
            else {
                return log;
            }
        });
    }
}
class ContractTransactionResponse extends _providers_provider_js__WEBPACK_IMPORTED_MODULE_0__.TransactionResponse {
    #interface;
    constructor(iface, provider, tx) {
        super(tx, provider);
        this.#interface = iface;
    }
    async wait(confirms) {
        const receipt = await super.wait();
        if (receipt == null) {
            return null;
        }
        return new ContractTransactionReceipt(this.#interface, this.provider, receipt);
    }
}
class ContractUnknownEventPayload extends _utils_index_js__WEBPACK_IMPORTED_MODULE_2__.EventPayload {
    log;
    constructor(contract, listener, filter, log) {
        super(contract, listener, filter);
        (0,_utils_index_js__WEBPACK_IMPORTED_MODULE_1__.defineProperties)(this, { log });
    }
    async getBlock() {
        return await this.log.getBlock();
    }
    async getTransaction() {
        return await this.log.getTransaction();
    }
    async getTransactionReceipt() {
        return await this.log.getTransactionReceipt();
    }
}
class ContractEventPayload extends ContractUnknownEventPayload {
    constructor(contract, listener, filter, fragment, _log) {
        super(contract, listener, filter, new EventLog(_log, contract.interface, fragment));
        const args = contract.interface.decodeEventLog(fragment, this.log.data, this.log.topics);
        (0,_utils_index_js__WEBPACK_IMPORTED_MODULE_1__.defineProperties)(this, { args, fragment });
    }
    get eventName() {
        return this.fragment.name;
    }
    get eventSignature() {
        return this.fragment.format();
    }
}
//# sourceMappingURL=wrappers.js.map

/***/ }),

/***/ "./node_modules/ethers/lib.esm/crypto/crypto-browser.js":
/*!**************************************************************!*\
  !*** ./node_modules/ethers/lib.esm/crypto/crypto-browser.js ***!
  \**************************************************************/
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "createHash": () => (/* binding */ createHash),
/* harmony export */   "createHmac": () => (/* binding */ createHmac),
/* harmony export */   "pbkdf2Sync": () => (/* binding */ pbkdf2Sync),
/* harmony export */   "randomBytes": () => (/* binding */ randomBytes)
/* harmony export */ });
/* harmony import */ var _noble_hashes_hmac__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @noble/hashes/hmac */ "./node_modules/@noble/hashes/esm/hmac.js");
/* harmony import */ var _noble_hashes_pbkdf2__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @noble/hashes/pbkdf2 */ "./node_modules/@noble/hashes/esm/pbkdf2.js");
/* harmony import */ var _noble_hashes_sha256__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! @noble/hashes/sha256 */ "./node_modules/@noble/hashes/esm/sha256.js");
/* harmony import */ var _noble_hashes_sha512__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! @noble/hashes/sha512 */ "./node_modules/@noble/hashes/esm/sha512.js");
/* harmony import */ var _utils_index_js__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ../utils/index.js */ "./node_modules/ethers/lib.esm/utils/errors.js");
/* Browser Crypto Shims */





function getGlobal() {
    if (typeof self !== 'undefined') {
        return self;
    }
    if (typeof window !== 'undefined') {
        return window;
    }
    if (typeof global !== 'undefined') {
        return global;
    }
    throw new Error('unable to locate global object');
}
;
const anyGlobal = getGlobal();
const crypto = anyGlobal.crypto || anyGlobal.msCrypto;
function createHash(algo) {
    switch (algo) {
        case "sha256": return _noble_hashes_sha256__WEBPACK_IMPORTED_MODULE_2__.sha256.create();
        case "sha512": return _noble_hashes_sha512__WEBPACK_IMPORTED_MODULE_3__.sha512.create();
    }
    (0,_utils_index_js__WEBPACK_IMPORTED_MODULE_4__.assertArgument)(false, "invalid hashing algorithm name", "algorithm", algo);
}
function createHmac(_algo, key) {
    const algo = ({ sha256: _noble_hashes_sha256__WEBPACK_IMPORTED_MODULE_2__.sha256, sha512: _noble_hashes_sha512__WEBPACK_IMPORTED_MODULE_3__.sha512 }[_algo]);
    (0,_utils_index_js__WEBPACK_IMPORTED_MODULE_4__.assertArgument)(algo != null, "invalid hmac algorithm", "algorithm", _algo);
    return _noble_hashes_hmac__WEBPACK_IMPORTED_MODULE_0__.hmac.create(algo, key);
}
function pbkdf2Sync(password, salt, iterations, keylen, _algo) {
    const algo = ({ sha256: _noble_hashes_sha256__WEBPACK_IMPORTED_MODULE_2__.sha256, sha512: _noble_hashes_sha512__WEBPACK_IMPORTED_MODULE_3__.sha512 }[_algo]);
    (0,_utils_index_js__WEBPACK_IMPORTED_MODULE_4__.assertArgument)(algo != null, "invalid pbkdf2 algorithm", "algorithm", _algo);
    return (0,_noble_hashes_pbkdf2__WEBPACK_IMPORTED_MODULE_1__.pbkdf2)(algo, password, salt, { c: iterations, dkLen: keylen });
}
function randomBytes(length) {
    (0,_utils_index_js__WEBPACK_IMPORTED_MODULE_4__.assert)(crypto != null, "platform does not support secure random numbers", "UNSUPPORTED_OPERATION", {
        operation: "randomBytes"
    });
    (0,_utils_index_js__WEBPACK_IMPORTED_MODULE_4__.assertArgument)(Number.isInteger(length) && length > 0 && length <= 1024, "invalid length", "length", length);
    const result = new Uint8Array(length);
    crypto.getRandomValues(result);
    return result;
}
//# sourceMappingURL=crypto-browser.js.map

/***/ }),

/***/ "./node_modules/ethers/lib.esm/crypto/hmac.js":
/*!****************************************************!*\
  !*** ./node_modules/ethers/lib.esm/crypto/hmac.js ***!
  \****************************************************/
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "computeHmac": () => (/* binding */ computeHmac)
/* harmony export */ });
/* harmony import */ var _crypto_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./crypto.js */ "./node_modules/ethers/lib.esm/crypto/crypto-browser.js");
/* harmony import */ var _utils_index_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../utils/index.js */ "./node_modules/ethers/lib.esm/utils/data.js");
/**
 *  An **HMAC** enables verification that a given key was used
 *  to authenticate a payload.
 *
 *  See: [[link-wiki-hmac]]
 *
 *  @_subsection: api/crypto:HMAC  [about-hmac]
 */


let locked = false;
const _computeHmac = function (algorithm, key, data) {
    return (0,_crypto_js__WEBPACK_IMPORTED_MODULE_0__.createHmac)(algorithm, key).update(data).digest();
};
let __computeHmac = _computeHmac;
/**
 *  Return the HMAC for %%data%% using the %%key%% key with the underlying
 *  %%algo%% used for compression.
 *
 *  @example:
 *    key = id("some-secret")
 *
 *    // Compute the HMAC
 *    computeHmac("sha256", key, "0x1337")
 *    //_result:
 *
 *    // To compute the HMAC of UTF-8 data, the data must be
 *    // converted to UTF-8 bytes
 *    computeHmac("sha256", key, toUtf8Bytes("Hello World"))
 *    //_result:
 *
 */
function computeHmac(algorithm, _key, _data) {
    const key = (0,_utils_index_js__WEBPACK_IMPORTED_MODULE_1__.getBytes)(_key, "key");
    const data = (0,_utils_index_js__WEBPACK_IMPORTED_MODULE_1__.getBytes)(_data, "data");
    return (0,_utils_index_js__WEBPACK_IMPORTED_MODULE_1__.hexlify)(__computeHmac(algorithm, key, data));
}
computeHmac._ = _computeHmac;
computeHmac.lock = function () { locked = true; };
computeHmac.register = function (func) {
    if (locked) {
        throw new Error("computeHmac is locked");
    }
    __computeHmac = func;
};
Object.freeze(computeHmac);
//# sourceMappingURL=hmac.js.map

/***/ }),

/***/ "./node_modules/ethers/lib.esm/crypto/keccak.js":
/*!******************************************************!*\
  !*** ./node_modules/ethers/lib.esm/crypto/keccak.js ***!
  \******************************************************/
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "keccak256": () => (/* binding */ keccak256)
/* harmony export */ });
/* harmony import */ var _noble_hashes_sha3__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @noble/hashes/sha3 */ "./node_modules/@noble/hashes/esm/sha3.js");
/* harmony import */ var _utils_index_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../utils/index.js */ "./node_modules/ethers/lib.esm/utils/data.js");
/**
 *  Cryptographic hashing functions
 *
 *  @_subsection: api/crypto:Hash Functions [about-crypto-hashing]
 */


let locked = false;
const _keccak256 = function (data) {
    return (0,_noble_hashes_sha3__WEBPACK_IMPORTED_MODULE_0__.keccak_256)(data);
};
let __keccak256 = _keccak256;
/**
 *  Compute the cryptographic KECCAK256 hash of %%data%%.
 *
 *  The %%data%% **must** be a data representation, to compute the
 *  hash of UTF-8 data use the [[id]] function.
 *
 *  @returns DataHexstring
 *  @example:
 *    keccak256("0x")
 *    //_result:
 *
 *    keccak256("0x1337")
 *    //_result:
 *
 *    keccak256(new Uint8Array([ 0x13, 0x37 ]))
 *    //_result:
 *
 *    // Strings are assumed to be DataHexString, otherwise it will
 *    // throw. To hash UTF-8 data, see the note above.
 *    keccak256("Hello World")
 *    //_error:
 */
function keccak256(_data) {
    const data = (0,_utils_index_js__WEBPACK_IMPORTED_MODULE_1__.getBytes)(_data, "data");
    return (0,_utils_index_js__WEBPACK_IMPORTED_MODULE_1__.hexlify)(__keccak256(data));
}
keccak256._ = _keccak256;
keccak256.lock = function () { locked = true; };
keccak256.register = function (func) {
    if (locked) {
        throw new TypeError("keccak256 is locked");
    }
    __keccak256 = func;
};
Object.freeze(keccak256);
//# sourceMappingURL=keccak.js.map

/***/ }),

/***/ "./node_modules/ethers/lib.esm/crypto/signature.js":
/*!*********************************************************!*\
  !*** ./node_modules/ethers/lib.esm/crypto/signature.js ***!
  \*********************************************************/
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "Signature": () => (/* binding */ Signature)
/* harmony export */ });
/* harmony import */ var _constants_index_js__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ../constants/index.js */ "./node_modules/ethers/lib.esm/constants/hashes.js");
/* harmony import */ var _utils_index_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../utils/index.js */ "./node_modules/ethers/lib.esm/utils/data.js");
/* harmony import */ var _utils_index_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../utils/index.js */ "./node_modules/ethers/lib.esm/utils/maths.js");
/* harmony import */ var _utils_index_js__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ../utils/index.js */ "./node_modules/ethers/lib.esm/utils/errors.js");


// Constants
const BN_0 = BigInt(0);
const BN_1 = BigInt(1);
const BN_2 = BigInt(2);
const BN_27 = BigInt(27);
const BN_28 = BigInt(28);
const BN_35 = BigInt(35);
const _guard = {};
function toUint256(value) {
    return (0,_utils_index_js__WEBPACK_IMPORTED_MODULE_0__.zeroPadValue)((0,_utils_index_js__WEBPACK_IMPORTED_MODULE_1__.toBeArray)(value), 32);
}
/**
 *  A Signature  @TODO
 *
 *
 *  @_docloc: api/crypto:Signing
 */
class Signature {
    #r;
    #s;
    #v;
    #networkV;
    /**
     *  The ``r`` value for a signautre.
     *
     *  This represents the ``x`` coordinate of a "reference" or
     *  challenge point, from which the ``y`` can be computed.
     */
    get r() { return this.#r; }
    set r(value) {
        (0,_utils_index_js__WEBPACK_IMPORTED_MODULE_2__.assertArgument)((0,_utils_index_js__WEBPACK_IMPORTED_MODULE_0__.dataLength)(value) === 32, "invalid r", "value", value);
        this.#r = (0,_utils_index_js__WEBPACK_IMPORTED_MODULE_0__.hexlify)(value);
    }
    /**
     *  The ``s`` value for a signature.
     */
    get s() { return this.#s; }
    set s(_value) {
        (0,_utils_index_js__WEBPACK_IMPORTED_MODULE_2__.assertArgument)((0,_utils_index_js__WEBPACK_IMPORTED_MODULE_0__.dataLength)(_value) === 32, "invalid r", "value", _value);
        const value = (0,_utils_index_js__WEBPACK_IMPORTED_MODULE_0__.hexlify)(_value);
        (0,_utils_index_js__WEBPACK_IMPORTED_MODULE_2__.assertArgument)(parseInt(value.substring(0, 3)) < 8, "non-canonical s", "value", value);
        this.#s = value;
    }
    /**
     *  The ``v`` value for a signature.
     *
     *  Since a given ``x`` value for ``r`` has two possible values for
     *  its correspondin ``y``, the ``v`` indicates which of the two ``y``
     *  values to use.
     *
     *  It is normalized to the values ``27`` or ``28`` for legacy
     *  purposes.
     */
    get v() { return this.#v; }
    set v(value) {
        const v = (0,_utils_index_js__WEBPACK_IMPORTED_MODULE_1__.getNumber)(value, "value");
        (0,_utils_index_js__WEBPACK_IMPORTED_MODULE_2__.assertArgument)(v === 27 || v === 28, "invalid v", "v", value);
        this.#v = v;
    }
    /**
     *  The EIP-155 ``v`` for legacy transactions. For non-legacy
     *  transactions, this value is ``null``.
     */
    get networkV() { return this.#networkV; }
    /**
     *  The chain ID for EIP-155 legacy transactions. For non-legacy
     *  transactions, this value is ``null``.
     */
    get legacyChainId() {
        const v = this.networkV;
        if (v == null) {
            return null;
        }
        return Signature.getChainId(v);
    }
    /**
     *  The ``yParity`` for the signature.
     *
     *  See ``v`` for more details on how this value is used.
     */
    get yParity() {
        return (this.v === 27) ? 0 : 1;
    }
    /**
     *  The [[link-eip-2098]] compact representation of the ``yParity``
     *  and ``s`` compacted into a single ``bytes32``.
     */
    get yParityAndS() {
        // The EIP-2098 compact representation
        const yParityAndS = (0,_utils_index_js__WEBPACK_IMPORTED_MODULE_0__.getBytes)(this.s);
        if (this.yParity) {
            yParityAndS[0] |= 0x80;
        }
        return (0,_utils_index_js__WEBPACK_IMPORTED_MODULE_0__.hexlify)(yParityAndS);
    }
    /**
     *  The [[link-eip-2098]] compact representation.
     */
    get compactSerialized() {
        return (0,_utils_index_js__WEBPACK_IMPORTED_MODULE_0__.concat)([this.r, this.yParityAndS]);
    }
    /**
     *  The serialized representation.
     */
    get serialized() {
        return (0,_utils_index_js__WEBPACK_IMPORTED_MODULE_0__.concat)([this.r, this.s, (this.yParity ? "0x1c" : "0x1b")]);
    }
    /**
     *  @private
     */
    constructor(guard, r, s, v) {
        (0,_utils_index_js__WEBPACK_IMPORTED_MODULE_2__.assertPrivate)(guard, _guard, "Signature");
        this.#r = r;
        this.#s = s;
        this.#v = v;
        this.#networkV = null;
    }
    [Symbol.for('nodejs.util.inspect.custom')]() {
        return `Signature { r: "${this.r}", s: "${this.s}", yParity: ${this.yParity}, networkV: ${this.networkV} }`;
    }
    /**
     *  Returns a new identical [[Signature]].
     */
    clone() {
        const clone = new Signature(_guard, this.r, this.s, this.v);
        if (this.networkV) {
            clone.#networkV = this.networkV;
        }
        return clone;
    }
    /**
     *  Returns a representation that is compatible with ``JSON.stringify``.
     */
    toJSON() {
        const networkV = this.networkV;
        return {
            _type: "signature",
            networkV: ((networkV != null) ? networkV.toString() : null),
            r: this.r, s: this.s, v: this.v,
        };
    }
    /**
     *  Compute the chain ID from the ``v`` in a legacy EIP-155 transactions.
     *
     *  @example:
     *    Signature.getChainId(45)
     *    //_result:
     *
     *    Signature.getChainId(46)
     *    //_result:
     */
    static getChainId(v) {
        const bv = (0,_utils_index_js__WEBPACK_IMPORTED_MODULE_1__.getBigInt)(v, "v");
        // The v is not an EIP-155 v, so it is the unspecified chain ID
        if ((bv == BN_27) || (bv == BN_28)) {
            return BN_0;
        }
        // Bad value for an EIP-155 v
        (0,_utils_index_js__WEBPACK_IMPORTED_MODULE_2__.assertArgument)(bv >= BN_35, "invalid EIP-155 v", "v", v);
        return (bv - BN_35) / BN_2;
    }
    /**
     *  Compute the ``v`` for a chain ID for a legacy EIP-155 transactions.
     *
     *  Legacy transactions which use [[link-eip-155]] hijack the ``v``
     *  property to include the chain ID.
     *
     *  @example:
     *    Signature.getChainIdV(5, 27)
     *    //_result:
     *
     *    Signature.getChainIdV(5, 28)
     *    //_result:
     *
     */
    static getChainIdV(chainId, v) {
        return ((0,_utils_index_js__WEBPACK_IMPORTED_MODULE_1__.getBigInt)(chainId) * BN_2) + BigInt(35 + v - 27);
    }
    /**
     *  Compute the normalized legacy transaction ``v`` from a ``yParirty``,
     *  a legacy transaction ``v`` or a legacy [[link-eip-155]] transaction.
     *
     *  @example:
     *    // The values 0 and 1 imply v is actually yParity
     *    Signature.getNormalizedV(0)
     *    //_result:
     *
     *    // Legacy non-EIP-1559 transaction (i.e. 27 or 28)
     *    Signature.getNormalizedV(27)
     *    //_result:
     *
     *    // Legacy EIP-155 transaction (i.e. >= 35)
     *    Signature.getNormalizedV(46)
     *    //_result:
     *
     *    // Invalid values throw
     *    Signature.getNormalizedV(5)
     *    //_error:
     */
    static getNormalizedV(v) {
        const bv = (0,_utils_index_js__WEBPACK_IMPORTED_MODULE_1__.getBigInt)(v);
        if (bv === BN_0 || bv === BN_27) {
            return 27;
        }
        if (bv === BN_1 || bv === BN_28) {
            return 28;
        }
        (0,_utils_index_js__WEBPACK_IMPORTED_MODULE_2__.assertArgument)(bv >= BN_35, "invalid v", "v", v);
        // Otherwise, EIP-155 v means odd is 27 and even is 28
        return (bv & BN_1) ? 27 : 28;
    }
    /**
     *  Creates a new [[Signature]].
     *
     *  If no %%sig%% is provided, a new [[Signature]] is created
     *  with default values.
     *
     *  If %%sig%% is a string, it is parsed.
     */
    static from(sig) {
        function assertError(check, message) {
            (0,_utils_index_js__WEBPACK_IMPORTED_MODULE_2__.assertArgument)(check, message, "signature", sig);
        }
        ;
        if (sig == null) {
            return new Signature(_guard, _constants_index_js__WEBPACK_IMPORTED_MODULE_3__.ZeroHash, _constants_index_js__WEBPACK_IMPORTED_MODULE_3__.ZeroHash, 27);
        }
        if (typeof (sig) === "string") {
            const bytes = (0,_utils_index_js__WEBPACK_IMPORTED_MODULE_0__.getBytes)(sig, "signature");
            if (bytes.length === 64) {
                const r = (0,_utils_index_js__WEBPACK_IMPORTED_MODULE_0__.hexlify)(bytes.slice(0, 32));
                const s = bytes.slice(32, 64);
                const v = (s[0] & 0x80) ? 28 : 27;
                s[0] &= 0x7f;
                return new Signature(_guard, r, (0,_utils_index_js__WEBPACK_IMPORTED_MODULE_0__.hexlify)(s), v);
            }
            if (bytes.length === 65) {
                const r = (0,_utils_index_js__WEBPACK_IMPORTED_MODULE_0__.hexlify)(bytes.slice(0, 32));
                const s = bytes.slice(32, 64);
                assertError((s[0] & 0x80) === 0, "non-canonical s");
                const v = Signature.getNormalizedV(bytes[64]);
                return new Signature(_guard, r, (0,_utils_index_js__WEBPACK_IMPORTED_MODULE_0__.hexlify)(s), v);
            }
            assertError(false, "invlaid raw signature length");
        }
        if (sig instanceof Signature) {
            return sig.clone();
        }
        // Get r
        const _r = sig.r;
        assertError(_r != null, "missing r");
        const r = toUint256(_r);
        // Get s; by any means necessary (we check consistency below)
        const s = (function (s, yParityAndS) {
            if (s != null) {
                return toUint256(s);
            }
            if (yParityAndS != null) {
                assertError((0,_utils_index_js__WEBPACK_IMPORTED_MODULE_0__.isHexString)(yParityAndS, 32), "invalid yParityAndS");
                const bytes = (0,_utils_index_js__WEBPACK_IMPORTED_MODULE_0__.getBytes)(yParityAndS);
                bytes[0] &= 0x7f;
                return (0,_utils_index_js__WEBPACK_IMPORTED_MODULE_0__.hexlify)(bytes);
            }
            assertError(false, "missing s");
        })(sig.s, sig.yParityAndS);
        assertError(((0,_utils_index_js__WEBPACK_IMPORTED_MODULE_0__.getBytes)(s)[0] & 0x80) == 0, "non-canonical s");
        // Get v; by any means necessary (we check consistency below)
        const { networkV, v } = (function (_v, yParityAndS, yParity) {
            if (_v != null) {
                const v = (0,_utils_index_js__WEBPACK_IMPORTED_MODULE_1__.getBigInt)(_v);
                return {
                    networkV: ((v >= BN_35) ? v : undefined),
                    v: Signature.getNormalizedV(v)
                };
            }
            if (yParityAndS != null) {
                assertError((0,_utils_index_js__WEBPACK_IMPORTED_MODULE_0__.isHexString)(yParityAndS, 32), "invalid yParityAndS");
                return { v: (((0,_utils_index_js__WEBPACK_IMPORTED_MODULE_0__.getBytes)(yParityAndS)[0] & 0x80) ? 28 : 27) };
            }
            if (yParity != null) {
                switch (yParity) {
                    case 0: return { v: 27 };
                    case 1: return { v: 28 };
                }
                assertError(false, "invalid yParity");
            }
            assertError(false, "missing v");
        })(sig.v, sig.yParityAndS, sig.yParity);
        const result = new Signature(_guard, r, s, v);
        if (networkV) {
            result.#networkV = networkV;
        }
        // If multiple of v, yParity, yParityAndS we given, check they match
        assertError(!("yParity" in sig && sig.yParity !== result.yParity), "yParity mismatch");
        assertError(!("yParityAndS" in sig && sig.yParityAndS !== result.yParityAndS), "yParityAndS mismatch");
        return result;
    }
}
//# sourceMappingURL=signature.js.map

/***/ }),

/***/ "./node_modules/ethers/lib.esm/crypto/signing-key.js":
/*!***********************************************************!*\
  !*** ./node_modules/ethers/lib.esm/crypto/signing-key.js ***!
  \***********************************************************/
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "SigningKey": () => (/* binding */ SigningKey)
/* harmony export */ });
/* harmony import */ var _noble_secp256k1__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @noble/secp256k1 */ "./node_modules/@noble/secp256k1/lib/esm/index.js");
/* harmony import */ var _utils_index_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../utils/index.js */ "./node_modules/ethers/lib.esm/utils/data.js");
/* harmony import */ var _utils_index_js__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ../utils/index.js */ "./node_modules/ethers/lib.esm/utils/errors.js");
/* harmony import */ var _utils_index_js__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! ../utils/index.js */ "./node_modules/ethers/lib.esm/utils/maths.js");
/* harmony import */ var _hmac_js__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./hmac.js */ "./node_modules/ethers/lib.esm/crypto/hmac.js");
/* harmony import */ var _signature_js__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ./signature.js */ "./node_modules/ethers/lib.esm/crypto/signature.js");
/**
 *  Add details about signing here.
 *
 *  @_subsection: api/crypto:Signing  [about-signing]
 */




//const N = BigInt("0xfffffffffffffffffffffffffffffffebaaedce6af48a03bbfd25e8cd0364141");
// Make noble-secp256k1 sync
_noble_secp256k1__WEBPACK_IMPORTED_MODULE_0__.utils.hmacSha256Sync = function (key, ...messages) {
    return (0,_utils_index_js__WEBPACK_IMPORTED_MODULE_1__.getBytes)((0,_hmac_js__WEBPACK_IMPORTED_MODULE_2__.computeHmac)("sha256", key, (0,_utils_index_js__WEBPACK_IMPORTED_MODULE_1__.concat)(messages)));
};
/**
 *  A **SigningKey** provides high-level access to the elliptic curve
 *  cryptography (ECC) operations and key management.
 */
class SigningKey {
    #privateKey;
    /**
     *  Creates a new **SigningKey** for %%privateKey%%.
     */
    constructor(privateKey) {
        (0,_utils_index_js__WEBPACK_IMPORTED_MODULE_3__.assertArgument)((0,_utils_index_js__WEBPACK_IMPORTED_MODULE_1__.dataLength)(privateKey) === 32, "invalid private key", "privateKey", "[REDACTED]");
        this.#privateKey = (0,_utils_index_js__WEBPACK_IMPORTED_MODULE_1__.hexlify)(privateKey);
    }
    /**
     *  The private key.
     */
    get privateKey() { return this.#privateKey; }
    /**
     *  The uncompressed public key.
     *
     * This will always begin with the prefix ``0x04`` and be 132
     * characters long (the ``0x`` prefix and 130 hexadecimal nibbles).
     */
    get publicKey() { return SigningKey.computePublicKey(this.#privateKey); }
    /**
     *  The compressed public key.
     *
     *  This will always begin with either the prefix ``0x02`` or ``0x03``
     *  and be 68 characters long (the ``0x`` prefix and 33 hexadecimal
     *  nibbles)
     */
    get compressedPublicKey() { return SigningKey.computePublicKey(this.#privateKey, true); }
    /**
     *  Return the signature of the signed %%digest%%.
     */
    sign(digest) {
        (0,_utils_index_js__WEBPACK_IMPORTED_MODULE_3__.assertArgument)((0,_utils_index_js__WEBPACK_IMPORTED_MODULE_1__.dataLength)(digest) === 32, "invalid digest length", "digest", digest);
        const [sigDer, recid] = _noble_secp256k1__WEBPACK_IMPORTED_MODULE_0__.signSync((0,_utils_index_js__WEBPACK_IMPORTED_MODULE_1__.getBytesCopy)(digest), (0,_utils_index_js__WEBPACK_IMPORTED_MODULE_1__.getBytesCopy)(this.#privateKey), {
            recovered: true,
            canonical: true
        });
        const sig = _noble_secp256k1__WEBPACK_IMPORTED_MODULE_0__.Signature.fromHex(sigDer);
        return _signature_js__WEBPACK_IMPORTED_MODULE_4__.Signature.from({
            r: (0,_utils_index_js__WEBPACK_IMPORTED_MODULE_5__.toBeHex)("0x" + sig.r.toString(16), 32),
            s: (0,_utils_index_js__WEBPACK_IMPORTED_MODULE_5__.toBeHex)("0x" + sig.s.toString(16), 32),
            v: (recid ? 0x1c : 0x1b)
        });
    }
    /**
     *  Returns the [[link-wiki-ecdh]] shared secret between this
     *  private key and the %%other%% key.
     *
     *  The %%other%% key may be any type of key, a raw public key,
     *  a compressed/uncompressed pubic key or aprivate key.
     *
     *  Best practice is usually to use a cryptographic hash on the
     *  returned value before using it as a symetric secret.
     *
     *  @example:
     *    sign1 = new SigningKey(id("some-secret-1"))
     *    sign2 = new SigningKey(id("some-secret-2"))
     *
     *    // Notice that privA.computeSharedSecret(pubB)...
     *    sign1.computeSharedSecret(sign2.publicKey)
     *    //_result:
     *
     *    // ...is equal to privB.computeSharedSecret(pubA).
     *    sign2.computeSharedSecret(sign1.publicKey)
     *    //_result:
     */
    computeSharedSecret(other) {
        const pubKey = SigningKey.computePublicKey(other);
        console.log(pubKey);
        return (0,_utils_index_js__WEBPACK_IMPORTED_MODULE_1__.hexlify)(_noble_secp256k1__WEBPACK_IMPORTED_MODULE_0__.getSharedSecret((0,_utils_index_js__WEBPACK_IMPORTED_MODULE_1__.getBytesCopy)(this.#privateKey), (0,_utils_index_js__WEBPACK_IMPORTED_MODULE_1__.getBytes)(pubKey)));
    }
    /**
     *  Compute the public key for %%key%%, optionally %%compressed%%.
     *
     *  The %%key%% may be any type of key, a raw public key, a
     *  compressed/uncompressed public key or private key.
     *
     *  @example:
     *    sign = new SigningKey(id("some-secret"));
     *
     *    // Compute the uncompressed public key for a private key
     *    SigningKey.computePublicKey(sign.privateKey)
     *    //_result:
     *
     *    // Compute the compressed public key for a private key
     *    SigningKey.computePublicKey(sign.privateKey, true)
     *    //_result:
     *
     *    // Compute the uncompressed public key
     *    SigningKey.computePublicKey(sign.publicKey, false);
     *    //_result:
     *
     *    // Compute the Compressed a public key
     *    SigningKey.computePublicKey(sign.publicKey, true);
     *    //_result:
     */
    static computePublicKey(key, compressed) {
        let bytes = (0,_utils_index_js__WEBPACK_IMPORTED_MODULE_1__.getBytes)(key, "key");
        // private key
        if (bytes.length === 32) {
            const pubKey = _noble_secp256k1__WEBPACK_IMPORTED_MODULE_0__.getPublicKey(bytes, !!compressed);
            return (0,_utils_index_js__WEBPACK_IMPORTED_MODULE_1__.hexlify)(pubKey);
        }
        // raw public key; use uncompressed key with 0x04 prefix
        if (bytes.length === 64) {
            const pub = new Uint8Array(65);
            pub[0] = 0x04;
            pub.set(bytes, 1);
            bytes = pub;
        }
        const point = _noble_secp256k1__WEBPACK_IMPORTED_MODULE_0__.Point.fromHex(bytes);
        return (0,_utils_index_js__WEBPACK_IMPORTED_MODULE_1__.hexlify)(point.toRawBytes(compressed));
    }
    /**
     *  Returns the public key for the private key which produced the
     *  %%signature%% for the given %%digest%%.
     *
     *  @example:
     *    key = new SigningKey(id("some-secret"))
     *    digest = id("hello world")
     *    sig = key.sign(digest)
     *
     *    // Notice the signer public key...
     *    key.publicKey
     *    //_result:
     *
     *    // ...is equal to the recovered public key
     *    SigningKey.recoverPublicKey(digest, sig)
     *    //_result:
     *
     */
    static recoverPublicKey(digest, signature) {
        (0,_utils_index_js__WEBPACK_IMPORTED_MODULE_3__.assertArgument)((0,_utils_index_js__WEBPACK_IMPORTED_MODULE_1__.dataLength)(digest) === 32, "invalid digest length", "digest", digest);
        const sig = _signature_js__WEBPACK_IMPORTED_MODULE_4__.Signature.from(signature);
        const der = _noble_secp256k1__WEBPACK_IMPORTED_MODULE_0__.Signature.fromCompact((0,_utils_index_js__WEBPACK_IMPORTED_MODULE_1__.getBytesCopy)((0,_utils_index_js__WEBPACK_IMPORTED_MODULE_1__.concat)([sig.r, sig.s]))).toDERRawBytes();
        const pubKey = _noble_secp256k1__WEBPACK_IMPORTED_MODULE_0__.recoverPublicKey((0,_utils_index_js__WEBPACK_IMPORTED_MODULE_1__.getBytesCopy)(digest), der, sig.yParity);
        if (pubKey != null) {
            return (0,_utils_index_js__WEBPACK_IMPORTED_MODULE_1__.hexlify)(pubKey);
        }
        (0,_utils_index_js__WEBPACK_IMPORTED_MODULE_3__.assertArgument)(false, "invalid signautre for digest", "signature", signature);
    }
    /**
     *  Returns the point resulting from adding the ellipic curve points
     *  %%p0%% and %%p1%%.
     *
     *  This is not a common function most developers should require, but
     *  can be useful for certain privacy-specific techniques.
     *
     *  For example, it is used by [[HDNodeWallet]] to compute child
     *  addresses from parent public keys and chain codes.
     */
    static addPoints(p0, p1, compressed) {
        const pub0 = _noble_secp256k1__WEBPACK_IMPORTED_MODULE_0__.Point.fromHex(SigningKey.computePublicKey(p0).substring(2));
        const pub1 = _noble_secp256k1__WEBPACK_IMPORTED_MODULE_0__.Point.fromHex(SigningKey.computePublicKey(p1).substring(2));
        return "0x" + pub0.add(pub1).toHex(!!compressed);
    }
}
//# sourceMappingURL=signing-key.js.map

/***/ }),

/***/ "./node_modules/ethers/lib.esm/hash/id.js":
/*!************************************************!*\
  !*** ./node_modules/ethers/lib.esm/hash/id.js ***!
  \************************************************/
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "id": () => (/* binding */ id)
/* harmony export */ });
/* harmony import */ var _crypto_index_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../crypto/index.js */ "./node_modules/ethers/lib.esm/crypto/keccak.js");
/* harmony import */ var _utils_index_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../utils/index.js */ "./node_modules/ethers/lib.esm/utils/utf8.js");


/**
 *  A simple hashing function which operates on UTF-8 strings to
 *  compute an 32-byte irentifier.
 *
 *  This simply computes the [UTF-8 bytes](toUtf8Bytes) and computes
 *  the [[keccak256]].
 *
 *  @example:
 *    id("hello world")
 *    //_result:
 */
function id(value) {
    return (0,_crypto_index_js__WEBPACK_IMPORTED_MODULE_0__.keccak256)((0,_utils_index_js__WEBPACK_IMPORTED_MODULE_1__.toUtf8Bytes)(value));
}
//# sourceMappingURL=id.js.map

/***/ }),

/***/ "./node_modules/ethers/lib.esm/hash/namehash.js":
/*!******************************************************!*\
  !*** ./node_modules/ethers/lib.esm/hash/namehash.js ***!
  \******************************************************/
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "dnsEncode": () => (/* binding */ dnsEncode),
/* harmony export */   "ensNormalize": () => (/* binding */ ensNormalize),
/* harmony export */   "isValidName": () => (/* binding */ isValidName),
/* harmony export */   "namehash": () => (/* binding */ namehash)
/* harmony export */ });
/* harmony import */ var _crypto_index_js__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ../crypto/index.js */ "./node_modules/ethers/lib.esm/crypto/keccak.js");
/* harmony import */ var _utils_index_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../utils/index.js */ "./node_modules/ethers/lib.esm/utils/errors.js");
/* harmony import */ var _utils_index_js__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ../utils/index.js */ "./node_modules/ethers/lib.esm/utils/utf8.js");
/* harmony import */ var _utils_index_js__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ../utils/index.js */ "./node_modules/ethers/lib.esm/utils/data.js");
/* harmony import */ var _adraffy_ens_normalize__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @adraffy/ens-normalize */ "./node_modules/@adraffy/ens-normalize/dist/index-xnf.js");



const Zeros = new Uint8Array(32);
Zeros.fill(0);
function checkComponent(comp) {
    (0,_utils_index_js__WEBPACK_IMPORTED_MODULE_1__.assertArgument)(comp.length !== 0, "invalid ENS name; empty component", "comp", comp);
    return comp;
}
function ensNameSplit(name) {
    const bytes = (0,_utils_index_js__WEBPACK_IMPORTED_MODULE_2__.toUtf8Bytes)(ensNormalize(name));
    const comps = [];
    if (name.length === 0) {
        return comps;
    }
    let last = 0;
    for (let i = 0; i < bytes.length; i++) {
        const d = bytes[i];
        // A separator (i.e. "."); copy this component
        if (d === 0x2e) {
            comps.push(checkComponent(bytes.slice(last, i)));
            last = i + 1;
        }
    }
    // There was a stray separator at the end of the name
    (0,_utils_index_js__WEBPACK_IMPORTED_MODULE_1__.assertArgument)(last < bytes.length, "invalid ENS name; empty component", "name", name);
    comps.push(checkComponent(bytes.slice(last)));
    return comps;
}
/**
 *  Returns the ENS %%name%% normalized.
 */
function ensNormalize(name) {
    try {
        return (0,_adraffy_ens_normalize__WEBPACK_IMPORTED_MODULE_0__.ens_normalize)(name);
    }
    catch (error) {
        (0,_utils_index_js__WEBPACK_IMPORTED_MODULE_1__.assertArgument)(false, `invalid ENS name (${error.message})`, "name", name);
    }
}
/**
 *  Returns ``true`` if %%name%% is a valid ENS name.
 */
function isValidName(name) {
    try {
        return (ensNameSplit(name).length !== 0);
    }
    catch (error) { }
    return false;
}
/**
 *  Returns the [[link-namehash]] for %%name%%.
 */
function namehash(name) {
    (0,_utils_index_js__WEBPACK_IMPORTED_MODULE_1__.assertArgument)(typeof (name) === "string", "invalid ENS name; not a string", "name", name);
    let result = Zeros;
    const comps = ensNameSplit(name);
    while (comps.length) {
        result = (0,_crypto_index_js__WEBPACK_IMPORTED_MODULE_3__.keccak256)((0,_utils_index_js__WEBPACK_IMPORTED_MODULE_4__.concat)([result, (0,_crypto_index_js__WEBPACK_IMPORTED_MODULE_3__.keccak256)((comps.pop()))]));
    }
    return (0,_utils_index_js__WEBPACK_IMPORTED_MODULE_4__.hexlify)(result);
}
/**
 *  Returns the DNS encoded %%name%%.
 *
 *  This is used for various parts of ENS name resolution, such
 *  as the wildcard resolution.
 */
function dnsEncode(name) {
    return (0,_utils_index_js__WEBPACK_IMPORTED_MODULE_4__.hexlify)((0,_utils_index_js__WEBPACK_IMPORTED_MODULE_4__.concat)(ensNameSplit(name).map((comp) => {
        // DNS does not allow components over 63 bytes in length
        if (comp.length > 63) {
            throw new Error("invalid DNS encoded entry; length exceeds 63 bytes");
        }
        const bytes = new Uint8Array(comp.length + 1);
        bytes.set(comp, 1);
        bytes[0] = bytes.length - 1;
        return bytes;
    }))) + "00";
}
//# sourceMappingURL=namehash.js.map

/***/ }),

/***/ "./node_modules/ethers/lib.esm/hash/typed-data.js":
/*!********************************************************!*\
  !*** ./node_modules/ethers/lib.esm/hash/typed-data.js ***!
  \********************************************************/
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "TypedDataEncoder": () => (/* binding */ TypedDataEncoder)
/* harmony export */ });
/* harmony import */ var _address_index_js__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ../address/index.js */ "./node_modules/ethers/lib.esm/address/address.js");
/* harmony import */ var _crypto_index_js__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ../crypto/index.js */ "./node_modules/ethers/lib.esm/crypto/keccak.js");
/* harmony import */ var _utils_index_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../utils/index.js */ "./node_modules/ethers/lib.esm/utils/data.js");
/* harmony import */ var _utils_index_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../utils/index.js */ "./node_modules/ethers/lib.esm/utils/maths.js");
/* harmony import */ var _utils_index_js__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ../utils/index.js */ "./node_modules/ethers/lib.esm/utils/errors.js");
/* harmony import */ var _utils_index_js__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! ../utils/index.js */ "./node_modules/ethers/lib.esm/utils/properties.js");
/* harmony import */ var _id_js__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! ./id.js */ "./node_modules/ethers/lib.esm/hash/id.js");
//import { TypedDataDomain, TypedDataField } from "@ethersproject/providerabstract-signer";




const padding = new Uint8Array(32);
padding.fill(0);
const BN__1 = BigInt(-1);
const BN_0 = BigInt(0);
const BN_1 = BigInt(1);
const BN_MAX_UINT256 = BigInt("0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff");
;
;
function hexPadRight(value) {
    const bytes = (0,_utils_index_js__WEBPACK_IMPORTED_MODULE_0__.getBytes)(value);
    const padOffset = bytes.length % 32;
    if (padOffset) {
        return (0,_utils_index_js__WEBPACK_IMPORTED_MODULE_0__.concat)([bytes, padding.slice(padOffset)]);
    }
    return (0,_utils_index_js__WEBPACK_IMPORTED_MODULE_0__.hexlify)(bytes);
}
const hexTrue = (0,_utils_index_js__WEBPACK_IMPORTED_MODULE_1__.toBeHex)(BN_1, 32);
const hexFalse = (0,_utils_index_js__WEBPACK_IMPORTED_MODULE_1__.toBeHex)(BN_0, 32);
const domainFieldTypes = {
    name: "string",
    version: "string",
    chainId: "uint256",
    verifyingContract: "address",
    salt: "bytes32"
};
const domainFieldNames = [
    "name", "version", "chainId", "verifyingContract", "salt"
];
function checkString(key) {
    return function (value) {
        (0,_utils_index_js__WEBPACK_IMPORTED_MODULE_2__.assertArgument)(typeof (value) === "string", `invalid domain value for ${JSON.stringify(key)}`, `domain.${key}`, value);
        return value;
    };
}
const domainChecks = {
    name: checkString("name"),
    version: checkString("version"),
    chainId: function (value) {
        return (0,_utils_index_js__WEBPACK_IMPORTED_MODULE_1__.getBigInt)(value, "domain.chainId");
    },
    verifyingContract: function (value) {
        try {
            return (0,_address_index_js__WEBPACK_IMPORTED_MODULE_3__.getAddress)(value).toLowerCase();
        }
        catch (error) { }
        (0,_utils_index_js__WEBPACK_IMPORTED_MODULE_2__.assertArgument)(false, `invalid domain value "verifyingContract"`, "domain.verifyingContract", value);
    },
    salt: function (value) {
        const bytes = (0,_utils_index_js__WEBPACK_IMPORTED_MODULE_0__.getBytes)(value, "domain.salt");
        (0,_utils_index_js__WEBPACK_IMPORTED_MODULE_2__.assertArgument)(bytes.length === 32, `invalid domain value "salt"`, "domain.salt", value);
        return (0,_utils_index_js__WEBPACK_IMPORTED_MODULE_0__.hexlify)(bytes);
    }
};
function getBaseEncoder(type) {
    // intXX and uintXX
    {
        const match = type.match(/^(u?)int(\d*)$/);
        if (match) {
            const signed = (match[1] === "");
            const width = parseInt(match[2] || "256");
            (0,_utils_index_js__WEBPACK_IMPORTED_MODULE_2__.assertArgument)(width % 8 === 0 && width !== 0 && width <= 256 && (match[2] == null || match[2] === String(width)), "invalid numeric width", "type", type);
            const boundsUpper = (0,_utils_index_js__WEBPACK_IMPORTED_MODULE_1__.mask)(BN_MAX_UINT256, signed ? (width - 1) : width);
            const boundsLower = signed ? ((boundsUpper + BN_1) * BN__1) : BN_0;
            return function (_value) {
                const value = (0,_utils_index_js__WEBPACK_IMPORTED_MODULE_1__.getBigInt)(_value, "value");
                (0,_utils_index_js__WEBPACK_IMPORTED_MODULE_2__.assertArgument)(value >= boundsLower && value <= boundsUpper, `value out-of-bounds for ${type}`, "value", value);
                return (0,_utils_index_js__WEBPACK_IMPORTED_MODULE_1__.toBeHex)((0,_utils_index_js__WEBPACK_IMPORTED_MODULE_1__.toTwos)(value, 256), 32);
            };
        }
    }
    // bytesXX
    {
        const match = type.match(/^bytes(\d+)$/);
        if (match) {
            const width = parseInt(match[1]);
            (0,_utils_index_js__WEBPACK_IMPORTED_MODULE_2__.assertArgument)(width !== 0 && width <= 32 && match[1] === String(width), "invalid bytes width", "type", type);
            return function (value) {
                const bytes = (0,_utils_index_js__WEBPACK_IMPORTED_MODULE_0__.getBytes)(value);
                (0,_utils_index_js__WEBPACK_IMPORTED_MODULE_2__.assertArgument)(bytes.length === width, `invalid length for ${type}`, "value", value);
                return hexPadRight(value);
            };
        }
    }
    switch (type) {
        case "address": return function (value) {
            return (0,_utils_index_js__WEBPACK_IMPORTED_MODULE_0__.zeroPadValue)((0,_address_index_js__WEBPACK_IMPORTED_MODULE_3__.getAddress)(value), 32);
        };
        case "bool": return function (value) {
            return ((!value) ? hexFalse : hexTrue);
        };
        case "bytes": return function (value) {
            return (0,_crypto_index_js__WEBPACK_IMPORTED_MODULE_4__.keccak256)(value);
        };
        case "string": return function (value) {
            return (0,_id_js__WEBPACK_IMPORTED_MODULE_5__.id)(value);
        };
    }
    return null;
}
function encodeType(name, fields) {
    return `${name}(${fields.map(({ name, type }) => (type + " " + name)).join(",")})`;
}
class TypedDataEncoder {
    primaryType;
    #types;
    get types() {
        return JSON.parse(this.#types);
    }
    #fullTypes;
    #encoderCache;
    constructor(types) {
        this.#types = JSON.stringify(types);
        this.#fullTypes = new Map();
        this.#encoderCache = new Map();
        // Link struct types to their direct child structs
        const links = new Map();
        // Link structs to structs which contain them as a child
        const parents = new Map();
        // Link all subtypes within a given struct
        const subtypes = new Map();
        Object.keys(types).forEach((type) => {
            links.set(type, new Set());
            parents.set(type, []);
            subtypes.set(type, new Set());
        });
        for (const name in types) {
            const uniqueNames = new Set();
            for (const field of types[name]) {
                // Check each field has a unique name
                (0,_utils_index_js__WEBPACK_IMPORTED_MODULE_2__.assertArgument)(!uniqueNames.has(field.name), `duplicate variable name ${JSON.stringify(field.name)} in ${JSON.stringify(name)}`, "types", types);
                uniqueNames.add(field.name);
                // Get the base type (drop any array specifiers)
                const baseType = (field.type.match(/^([^\x5b]*)(\x5b|$)/))[1] || null;
                (0,_utils_index_js__WEBPACK_IMPORTED_MODULE_2__.assertArgument)(baseType !== name, `circular type reference to ${JSON.stringify(baseType)}`, "types", types);
                // Is this a base encoding type?
                const encoder = getBaseEncoder(baseType);
                if (encoder) {
                    continue;
                }
                (0,_utils_index_js__WEBPACK_IMPORTED_MODULE_2__.assertArgument)(parents.has(baseType), `unknown type ${JSON.stringify(baseType)}`, "types", types);
                // Add linkage
                parents.get(baseType).push(name);
                links.get(name).add(baseType);
            }
        }
        // Deduce the primary type
        const primaryTypes = Array.from(parents.keys()).filter((n) => (parents.get(n).length === 0));
        (0,_utils_index_js__WEBPACK_IMPORTED_MODULE_2__.assertArgument)(primaryTypes.length !== 0, "missing primary type", "types", types);
        (0,_utils_index_js__WEBPACK_IMPORTED_MODULE_2__.assertArgument)(primaryTypes.length === 1, `ambiguous primary types or unused types: ${primaryTypes.map((t) => (JSON.stringify(t))).join(", ")}`, "types", types);
        (0,_utils_index_js__WEBPACK_IMPORTED_MODULE_6__.defineProperties)(this, { primaryType: primaryTypes[0] });
        // Check for circular type references
        function checkCircular(type, found) {
            (0,_utils_index_js__WEBPACK_IMPORTED_MODULE_2__.assertArgument)(!found.has(type), `circular type reference to ${JSON.stringify(type)}`, "types", types);
            found.add(type);
            for (const child of links.get(type)) {
                if (!parents.has(child)) {
                    continue;
                }
                // Recursively check children
                checkCircular(child, found);
                // Mark all ancestors as having this decendant
                for (const subtype of found) {
                    subtypes.get(subtype).add(child);
                }
            }
            found.delete(type);
        }
        checkCircular(this.primaryType, new Set());
        // Compute each fully describe type
        for (const [name, set] of subtypes) {
            const st = Array.from(set);
            st.sort();
            this.#fullTypes.set(name, encodeType(name, types[name]) + st.map((t) => encodeType(t, types[t])).join(""));
        }
    }
    getEncoder(type) {
        let encoder = this.#encoderCache.get(type);
        if (!encoder) {
            encoder = this.#getEncoder(type);
            this.#encoderCache.set(type, encoder);
        }
        return encoder;
    }
    #getEncoder(type) {
        // Basic encoder type (address, bool, uint256, etc)
        {
            const encoder = getBaseEncoder(type);
            if (encoder) {
                return encoder;
            }
        }
        // Array
        const match = type.match(/^(.*)(\x5b(\d*)\x5d)$/);
        if (match) {
            const subtype = match[1];
            const subEncoder = this.getEncoder(subtype);
            return (value) => {
                (0,_utils_index_js__WEBPACK_IMPORTED_MODULE_2__.assertArgument)(!match[3] || parseInt(match[3]) === value.length, `array length mismatch; expected length ${parseInt(match[3])}`, "value", value);
                let result = value.map(subEncoder);
                if (this.#fullTypes.has(subtype)) {
                    result = result.map(_crypto_index_js__WEBPACK_IMPORTED_MODULE_4__.keccak256);
                }
                return (0,_crypto_index_js__WEBPACK_IMPORTED_MODULE_4__.keccak256)((0,_utils_index_js__WEBPACK_IMPORTED_MODULE_0__.concat)(result));
            };
        }
        // Struct
        const fields = this.types[type];
        if (fields) {
            const encodedType = (0,_id_js__WEBPACK_IMPORTED_MODULE_5__.id)(this.#fullTypes.get(type));
            return (value) => {
                const values = fields.map(({ name, type }) => {
                    const result = this.getEncoder(type)(value[name]);
                    if (this.#fullTypes.has(type)) {
                        return (0,_crypto_index_js__WEBPACK_IMPORTED_MODULE_4__.keccak256)(result);
                    }
                    return result;
                });
                values.unshift(encodedType);
                return (0,_utils_index_js__WEBPACK_IMPORTED_MODULE_0__.concat)(values);
            };
        }
        (0,_utils_index_js__WEBPACK_IMPORTED_MODULE_2__.assertArgument)(false, `unknown type: ${type}`, "type", type);
    }
    encodeType(name) {
        const result = this.#fullTypes.get(name);
        (0,_utils_index_js__WEBPACK_IMPORTED_MODULE_2__.assertArgument)(result, `unknown type: ${JSON.stringify(name)}`, "name", name);
        return result;
    }
    encodeData(type, value) {
        return this.getEncoder(type)(value);
    }
    hashStruct(name, value) {
        return (0,_crypto_index_js__WEBPACK_IMPORTED_MODULE_4__.keccak256)(this.encodeData(name, value));
    }
    encode(value) {
        return this.encodeData(this.primaryType, value);
    }
    hash(value) {
        return this.hashStruct(this.primaryType, value);
    }
    _visit(type, value, callback) {
        // Basic encoder type (address, bool, uint256, etc)
        {
            const encoder = getBaseEncoder(type);
            if (encoder) {
                return callback(type, value);
            }
        }
        // Array
        const match = type.match(/^(.*)(\x5b(\d*)\x5d)$/);
        if (match) {
            (0,_utils_index_js__WEBPACK_IMPORTED_MODULE_2__.assertArgument)(!match[3] || parseInt(match[3]) === value.length, `array length mismatch; expected length ${parseInt(match[3])}`, "value", value);
            return value.map((v) => this._visit(match[1], v, callback));
        }
        // Struct
        const fields = this.types[type];
        if (fields) {
            return fields.reduce((accum, { name, type }) => {
                accum[name] = this._visit(type, value[name], callback);
                return accum;
            }, {});
        }
        (0,_utils_index_js__WEBPACK_IMPORTED_MODULE_2__.assertArgument)(false, `unknown type: ${type}`, "type", type);
    }
    visit(value, callback) {
        return this._visit(this.primaryType, value, callback);
    }
    static from(types) {
        return new TypedDataEncoder(types);
    }
    static getPrimaryType(types) {
        return TypedDataEncoder.from(types).primaryType;
    }
    static hashStruct(name, types, value) {
        return TypedDataEncoder.from(types).hashStruct(name, value);
    }
    static hashDomain(domain) {
        const domainFields = [];
        for (const name in domain) {
            const type = domainFieldTypes[name];
            (0,_utils_index_js__WEBPACK_IMPORTED_MODULE_2__.assertArgument)(type, `invalid typed-data domain key: ${JSON.stringify(name)}`, "domain", domain);
            domainFields.push({ name, type });
        }
        domainFields.sort((a, b) => {
            return domainFieldNames.indexOf(a.name) - domainFieldNames.indexOf(b.name);
        });
        return TypedDataEncoder.hashStruct("EIP712Domain", { EIP712Domain: domainFields }, domain);
    }
    static encode(domain, types, value) {
        return (0,_utils_index_js__WEBPACK_IMPORTED_MODULE_0__.concat)([
            "0x1901",
            TypedDataEncoder.hashDomain(domain),
            TypedDataEncoder.from(types).hash(value)
        ]);
    }
    static hash(domain, types, value) {
        return (0,_crypto_index_js__WEBPACK_IMPORTED_MODULE_4__.keccak256)(TypedDataEncoder.encode(domain, types, value));
    }
    // Replaces all address types with ENS names with their looked up address
    static async resolveNames(domain, types, value, resolveName) {
        // Make a copy to isolate it from the object passed in
        domain = Object.assign({}, domain);
        // Look up all ENS names
        const ensCache = {};
        // Do we need to look up the domain's verifyingContract?
        if (domain.verifyingContract && !(0,_utils_index_js__WEBPACK_IMPORTED_MODULE_0__.isHexString)(domain.verifyingContract, 20)) {
            ensCache[domain.verifyingContract] = "0x";
        }
        // We are going to use the encoder to visit all the base values
        const encoder = TypedDataEncoder.from(types);
        // Get a list of all the addresses
        encoder.visit(value, (type, value) => {
            if (type === "address" && !(0,_utils_index_js__WEBPACK_IMPORTED_MODULE_0__.isHexString)(value, 20)) {
                ensCache[value] = "0x";
            }
            return value;
        });
        // Lookup each name
        for (const name in ensCache) {
            ensCache[name] = await resolveName(name);
        }
        // Replace the domain verifyingContract if needed
        if (domain.verifyingContract && ensCache[domain.verifyingContract]) {
            domain.verifyingContract = ensCache[domain.verifyingContract];
        }
        // Replace all ENS names with their address
        value = encoder.visit(value, (type, value) => {
            if (type === "address" && ensCache[value]) {
                return ensCache[value];
            }
            return value;
        });
        return { domain, value };
    }
    static getPayload(domain, types, value) {
        // Validate the domain fields
        TypedDataEncoder.hashDomain(domain);
        // Derive the EIP712Domain Struct reference type
        const domainValues = {};
        const domainTypes = [];
        domainFieldNames.forEach((name) => {
            const value = domain[name];
            if (value == null) {
                return;
            }
            domainValues[name] = domainChecks[name](value);
            domainTypes.push({ name, type: domainFieldTypes[name] });
        });
        const encoder = TypedDataEncoder.from(types);
        const typesWithDomain = Object.assign({}, types);
        (0,_utils_index_js__WEBPACK_IMPORTED_MODULE_2__.assertArgument)(typesWithDomain.EIP712Domain == null, "types must not contain EIP712Domain type", "types.EIP712Domain", types);
        typesWithDomain.EIP712Domain = domainTypes;
        // Validate the data structures and types
        encoder.encode(value);
        return {
            types: typesWithDomain,
            domain: domainValues,
            primaryType: encoder.primaryType,
            message: encoder.visit(value, (type, value) => {
                // bytes
                if (type.match(/^bytes(\d*)/)) {
                    return (0,_utils_index_js__WEBPACK_IMPORTED_MODULE_0__.hexlify)((0,_utils_index_js__WEBPACK_IMPORTED_MODULE_0__.getBytes)(value));
                }
                // uint or int
                if (type.match(/^u?int/)) {
                    return (0,_utils_index_js__WEBPACK_IMPORTED_MODULE_1__.getBigInt)(value).toString();
                }
                switch (type) {
                    case "address":
                        return value.toLowerCase();
                    case "bool":
                        return !!value;
                    case "string":
                        (0,_utils_index_js__WEBPACK_IMPORTED_MODULE_2__.assertArgument)(typeof (value) === "string", "invalid string", "value", value);
                        return value;
                }
                (0,_utils_index_js__WEBPACK_IMPORTED_MODULE_2__.assertArgument)(false, "unsupported type", "type", type);
            })
        };
    }
}
//# sourceMappingURL=typed-data.js.map

/***/ }),

/***/ "./node_modules/ethers/lib.esm/providers/abstract-provider.js":
/*!********************************************************************!*\
  !*** ./node_modules/ethers/lib.esm/providers/abstract-provider.js ***!
  \********************************************************************/
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "AbstractProvider": () => (/* binding */ AbstractProvider),
/* harmony export */   "UnmanagedSubscriber": () => (/* binding */ UnmanagedSubscriber)
/* harmony export */ });
/* harmony import */ var _address_index_js__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ../address/index.js */ "./node_modules/ethers/lib.esm/address/checks.js");
/* harmony import */ var _address_index_js__WEBPACK_IMPORTED_MODULE_11__ = __webpack_require__(/*! ../address/index.js */ "./node_modules/ethers/lib.esm/address/address.js");
/* harmony import */ var _constants_index_js__WEBPACK_IMPORTED_MODULE_14__ = __webpack_require__(/*! ../constants/index.js */ "./node_modules/ethers/lib.esm/constants/hashes.js");
/* harmony import */ var _contract_index_js__WEBPACK_IMPORTED_MODULE_13__ = __webpack_require__(/*! ../contract/index.js */ "./node_modules/ethers/lib.esm/contract/contract.js");
/* harmony import */ var _hash_index_js__WEBPACK_IMPORTED_MODULE_12__ = __webpack_require__(/*! ../hash/index.js */ "./node_modules/ethers/lib.esm/hash/namehash.js");
/* harmony import */ var _transaction_index_js__WEBPACK_IMPORTED_MODULE_9__ = __webpack_require__(/*! ../transaction/index.js */ "./node_modules/ethers/lib.esm/transaction/transaction.js");
/* harmony import */ var _utils_index_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../utils/index.js */ "./node_modules/ethers/lib.esm/utils/properties.js");
/* harmony import */ var _utils_index_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../utils/index.js */ "./node_modules/ethers/lib.esm/utils/data.js");
/* harmony import */ var _utils_index_js__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ../utils/index.js */ "./node_modules/ethers/lib.esm/utils/errors.js");
/* harmony import */ var _utils_index_js__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! ../utils/index.js */ "./node_modules/ethers/lib.esm/utils/fetch.js");
/* harmony import */ var _utils_index_js__WEBPACK_IMPORTED_MODULE_8__ = __webpack_require__(/*! ../utils/index.js */ "./node_modules/ethers/lib.esm/utils/maths.js");
/* harmony import */ var _utils_index_js__WEBPACK_IMPORTED_MODULE_16__ = __webpack_require__(/*! ../utils/index.js */ "./node_modules/ethers/lib.esm/utils/events.js");
/* harmony import */ var _utils_index_js__WEBPACK_IMPORTED_MODULE_17__ = __webpack_require__(/*! ../utils/index.js */ "./node_modules/ethers/lib.esm/utils/utf8.js");
/* harmony import */ var _ens_resolver_js__WEBPACK_IMPORTED_MODULE_10__ = __webpack_require__(/*! ./ens-resolver.js */ "./node_modules/ethers/lib.esm/providers/ens-resolver.js");
/* harmony import */ var _format_js__WEBPACK_IMPORTED_MODULE_7__ = __webpack_require__(/*! ./format.js */ "./node_modules/ethers/lib.esm/providers/format.js");
/* harmony import */ var _network_js__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ./network.js */ "./node_modules/ethers/lib.esm/providers/network.js");
/* harmony import */ var _provider_js__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! ./provider.js */ "./node_modules/ethers/lib.esm/providers/provider.js");
/* harmony import */ var _subscriber_polling_js__WEBPACK_IMPORTED_MODULE_15__ = __webpack_require__(/*! ./subscriber-polling.js */ "./node_modules/ethers/lib.esm/providers/subscriber-polling.js");
/**
 *  About Subclassing the Provider...
 *
 *  @_section: api/providers/abstract-provider: Subclassing Provider  [abstract-provider]
 */
// @TODO
// Event coalescence
//   When we register an event with an async value (e.g. address is a Signer
//   or ENS name), we need to add it immeidately for the Event API, but also
//   need time to resolve the address. Upon resolving the address, we need to
//   migrate the listener to the static event. We also need to maintain a map
//   of Signer/ENS name to address so we can sync respond to listenerCount.











// Constants
const BN_2 = BigInt(2);
const MAX_CCIP_REDIRECTS = 10;
function isPromise(value) {
    return (value && typeof (value.then) === "function");
}
function getTag(prefix, value) {
    return prefix + ":" + JSON.stringify(value, (k, v) => {
        if (v == null) {
            return "null";
        }
        if (typeof (v) === "bigint") {
            return `bigint:${v.toString()}`;
        }
        if (typeof (v) === "string") {
            return v.toLowerCase();
        }
        // Sort object keys
        if (typeof (v) === "object" && !Array.isArray(v)) {
            const keys = Object.keys(v);
            keys.sort();
            return keys.reduce((accum, key) => {
                accum[key] = v[key];
                return accum;
            }, {});
        }
        return v;
    });
}
class UnmanagedSubscriber {
    name;
    constructor(name) { (0,_utils_index_js__WEBPACK_IMPORTED_MODULE_0__.defineProperties)(this, { name }); }
    start() { }
    stop() { }
    pause(dropWhilePaused) { }
    resume() { }
}
function copy(value) {
    return JSON.parse(JSON.stringify(value));
}
function concisify(items) {
    items = Array.from((new Set(items)).values());
    items.sort();
    return items;
}
async function getSubscription(_event, provider) {
    if (_event == null) {
        throw new Error("invalid event");
    }
    // Normalize topic array info an EventFilter
    if (Array.isArray(_event)) {
        _event = { topics: _event };
    }
    if (typeof (_event) === "string") {
        switch (_event) {
            case "block":
            case "pending":
            case "debug":
            case "network": {
                return { type: _event, tag: _event };
            }
        }
    }
    if ((0,_utils_index_js__WEBPACK_IMPORTED_MODULE_1__.isHexString)(_event, 32)) {
        const hash = _event.toLowerCase();
        return { type: "transaction", tag: getTag("tx", { hash }), hash };
    }
    if (_event.orphan) {
        const event = _event;
        // @TODO: Should lowercase and whatnot things here instead of copy...
        return { type: "orphan", tag: getTag("orphan", event), filter: copy(event) };
    }
    if ((_event.address || _event.topics)) {
        const event = _event;
        const filter = {
            topics: ((event.topics || []).map((t) => {
                if (t == null) {
                    return null;
                }
                if (Array.isArray(t)) {
                    return concisify(t.map((t) => t.toLowerCase()));
                }
                return t.toLowerCase();
            }))
        };
        if (event.address) {
            const addresses = [];
            const promises = [];
            const addAddress = (addr) => {
                if ((0,_utils_index_js__WEBPACK_IMPORTED_MODULE_1__.isHexString)(addr)) {
                    addresses.push(addr);
                }
                else {
                    promises.push((async () => {
                        addresses.push(await (0,_address_index_js__WEBPACK_IMPORTED_MODULE_2__.resolveAddress)(addr, provider));
                    })());
                }
            };
            if (Array.isArray(event.address)) {
                event.address.forEach(addAddress);
            }
            else {
                addAddress(event.address);
            }
            if (promises.length) {
                await Promise.all(promises);
            }
            filter.address = concisify(addresses.map((a) => a.toLowerCase()));
        }
        return { filter, tag: getTag("event", filter), type: "event" };
    }
    (0,_utils_index_js__WEBPACK_IMPORTED_MODULE_3__.assertArgument)(false, "unknown ProviderEvent", "event", _event);
}
function getTime() { return (new Date()).getTime(); }
class AbstractProvider {
    #subs;
    #plugins;
    // null=unpaused, true=paused+dropWhilePaused, false=paused
    #pausedState;
    #networkPromise;
    #anyNetwork;
    #performCache;
    // The most recent block number if running an event or -1 if no "block" event
    #lastBlockNumber;
    #nextTimer;
    #timers;
    #disableCcipRead;
    // @TODO: This should be a () => Promise<Network> so network can be
    // done when needed; or rely entirely on _detectNetwork?
    constructor(_network) {
        if (_network === "any") {
            this.#anyNetwork = true;
            this.#networkPromise = null;
        }
        else if (_network) {
            const network = _network_js__WEBPACK_IMPORTED_MODULE_4__.Network.from(_network);
            this.#anyNetwork = false;
            this.#networkPromise = Promise.resolve(network);
            setTimeout(() => { this.emit("network", network, null); }, 0);
        }
        else {
            this.#anyNetwork = false;
            this.#networkPromise = null;
        }
        this.#lastBlockNumber = -1;
        this.#performCache = new Map();
        this.#subs = new Map();
        this.#plugins = new Map();
        this.#pausedState = null;
        this.#nextTimer = 1;
        this.#timers = new Map();
        this.#disableCcipRead = false;
    }
    get provider() { return this; }
    get plugins() {
        return Array.from(this.#plugins.values());
    }
    attachPlugin(plugin) {
        if (this.#plugins.get(plugin.name)) {
            throw new Error(`cannot replace existing plugin: ${plugin.name} `);
        }
        this.#plugins.set(plugin.name, plugin.connect(this));
        return this;
    }
    getPlugin(name) {
        return (this.#plugins.get(name)) || null;
    }
    get disableCcipRead() { return this.#disableCcipRead; }
    set disableCcipRead(value) { this.#disableCcipRead = !!value; }
    // Shares multiple identical requests made during the same 250ms
    async #perform(req) {
        // Create a tag
        const tag = getTag(req.method, req);
        let perform = this.#performCache.get(tag);
        if (!perform) {
            perform = this._perform(req);
            this.#performCache.set(tag, perform);
            setTimeout(() => {
                if (this.#performCache.get(tag) === perform) {
                    this.#performCache.delete(tag);
                }
            }, 250);
        }
        return await perform;
    }
    async ccipReadFetch(tx, calldata, urls) {
        if (this.disableCcipRead || urls.length === 0 || tx.to == null) {
            return null;
        }
        const sender = tx.to.toLowerCase();
        const data = calldata.toLowerCase();
        const errorMessages = [];
        for (let i = 0; i < urls.length; i++) {
            const url = urls[i];
            // URL expansion
            const href = url.replace("{sender}", sender).replace("{data}", data);
            // If no {data} is present, use POST; otherwise GET
            //const json: string | null = (url.indexOf("{data}") >= 0) ? null: JSON.stringify({ data, sender });
            //const result = await fetchJson({ url: href, errorPassThrough: true }, json, (value, response) => {
            //    value.status = response.statusCode;
            //    return value;
            //});
            const request = new _utils_index_js__WEBPACK_IMPORTED_MODULE_5__.FetchRequest(href);
            if (url.indexOf("{data}") === -1) {
                request.body = { data, sender };
            }
            this.emit("debug", { action: "sendCcipReadFetchRequest", request, index: i, urls });
            let errorMessage = "unknown error";
            const resp = await request.send();
            try {
                const result = resp.bodyJson;
                if (result.data) {
                    this.emit("debug", { action: "receiveCcipReadFetchResult", request, result });
                    return result.data;
                }
                if (result.message) {
                    errorMessage = result.message;
                }
                this.emit("debug", { action: "receiveCcipReadFetchError", request, result });
            }
            catch (error) { }
            // 4xx indicates the result is not present; stop
            (0,_utils_index_js__WEBPACK_IMPORTED_MODULE_3__.assert)(resp.statusCode < 400 || resp.statusCode >= 500, `response not found during CCIP fetch: ${errorMessage}`, "OFFCHAIN_FAULT", { reason: "404_MISSING_RESOURCE", transaction: tx, info: { url, errorMessage } });
            // 5xx indicates server issue; try the next url
            errorMessages.push(errorMessage);
        }
        (0,_utils_index_js__WEBPACK_IMPORTED_MODULE_3__.assert)(false, `error encountered during CCIP fetch: ${errorMessages.map((m) => JSON.stringify(m)).join(", ")}`, "OFFCHAIN_FAULT", {
            reason: "500_SERVER_ERROR",
            transaction: tx, info: { urls, errorMessages }
        });
    }
    _wrapBlock(value, network) {
        return new _provider_js__WEBPACK_IMPORTED_MODULE_6__.Block((0,_format_js__WEBPACK_IMPORTED_MODULE_7__.formatBlock)(value), this);
    }
    _wrapLog(value, network) {
        return new _provider_js__WEBPACK_IMPORTED_MODULE_6__.Log((0,_format_js__WEBPACK_IMPORTED_MODULE_7__.formatLog)(value), this);
    }
    _wrapTransactionReceipt(value, network) {
        return new _provider_js__WEBPACK_IMPORTED_MODULE_6__.TransactionReceipt((0,_format_js__WEBPACK_IMPORTED_MODULE_7__.formatTransactionReceipt)(value), this);
    }
    _wrapTransactionResponse(tx, network) {
        return new _provider_js__WEBPACK_IMPORTED_MODULE_6__.TransactionResponse(tx, this);
    }
    _detectNetwork() {
        (0,_utils_index_js__WEBPACK_IMPORTED_MODULE_3__.assert)(false, "sub-classes must implement this", "UNSUPPORTED_OPERATION", {
            operation: "_detectNetwork"
        });
    }
    // Sub-classes should override this and handle PerformActionRequest requests, calling
    // the super for any unhandled actions.
    async _perform(req) {
        (0,_utils_index_js__WEBPACK_IMPORTED_MODULE_3__.assert)(false, `unsupported method: ${req.method}`, "UNSUPPORTED_OPERATION", {
            operation: req.method,
            info: req
        });
    }
    // State
    async getBlockNumber() {
        const blockNumber = (0,_utils_index_js__WEBPACK_IMPORTED_MODULE_8__.getNumber)(await this.#perform({ method: "getBlockNumber" }), "%response");
        if (this.#lastBlockNumber >= 0) {
            this.#lastBlockNumber = blockNumber;
        }
        return blockNumber;
    }
    _getAddress(address) {
        return (0,_address_index_js__WEBPACK_IMPORTED_MODULE_2__.resolveAddress)(address, this);
    }
    _getBlockTag(blockTag) {
        if (blockTag == null) {
            return "latest";
        }
        switch (blockTag) {
            case "earliest":
                return "0x0";
            case "latest":
            case "pending":
            case "safe":
            case "finalized":
                return blockTag;
        }
        if ((0,_utils_index_js__WEBPACK_IMPORTED_MODULE_1__.isHexString)(blockTag)) {
            if ((0,_utils_index_js__WEBPACK_IMPORTED_MODULE_1__.isHexString)(blockTag, 32)) {
                return blockTag;
            }
            return (0,_utils_index_js__WEBPACK_IMPORTED_MODULE_8__.toQuantity)(blockTag);
        }
        if (typeof (blockTag) === "number") {
            if (blockTag >= 0) {
                return (0,_utils_index_js__WEBPACK_IMPORTED_MODULE_8__.toQuantity)(blockTag);
            }
            if (this.#lastBlockNumber >= 0) {
                return (0,_utils_index_js__WEBPACK_IMPORTED_MODULE_8__.toQuantity)(this.#lastBlockNumber + blockTag);
            }
            return this.getBlockNumber().then((b) => (0,_utils_index_js__WEBPACK_IMPORTED_MODULE_8__.toQuantity)(b + blockTag));
        }
        (0,_utils_index_js__WEBPACK_IMPORTED_MODULE_3__.assertArgument)(false, "invalid blockTag", "blockTag", blockTag);
    }
    _getFilter(filter) {
        // Create a canonical representation of the topics
        const topics = (filter.topics || []).map((t) => {
            if (t == null) {
                return null;
            }
            if (Array.isArray(t)) {
                return concisify(t.map((t) => t.toLowerCase()));
            }
            return t.toLowerCase();
        });
        const blockHash = ("blockHash" in filter) ? filter.blockHash : undefined;
        const resolve = (_address, fromBlock, toBlock) => {
            let address = undefined;
            switch (_address.length) {
                case 0: break;
                case 1:
                    address = _address[0];
                    break;
                default:
                    _address.sort();
                    address = _address;
            }
            if (blockHash) {
                if (fromBlock != null || toBlock != null) {
                    throw new Error("invalid filter");
                }
            }
            const filter = {};
            if (address) {
                filter.address = address;
            }
            if (topics.length) {
                filter.topics = topics;
            }
            if (fromBlock) {
                filter.fromBlock = fromBlock;
            }
            if (toBlock) {
                filter.toBlock = toBlock;
            }
            if (blockHash) {
                filter.blockHash = blockHash;
            }
            return filter;
        };
        // Addresses could be async (ENS names or Addressables)
        let address = [];
        if (filter.address) {
            if (Array.isArray(filter.address)) {
                for (const addr of filter.address) {
                    address.push(this._getAddress(addr));
                }
            }
            else {
                address.push(this._getAddress(filter.address));
            }
        }
        let fromBlock = undefined;
        if ("fromBlock" in filter) {
            fromBlock = this._getBlockTag(filter.fromBlock);
        }
        let toBlock = undefined;
        if ("toBlock" in filter) {
            toBlock = this._getBlockTag(filter.toBlock);
        }
        if (address.filter((a) => (typeof (a) !== "string")).length ||
            (fromBlock != null && typeof (fromBlock) !== "string") ||
            (toBlock != null && typeof (toBlock) !== "string")) {
            return Promise.all([Promise.all(address), fromBlock, toBlock]).then((result) => {
                return resolve(result[0], result[1], result[2]);
            });
        }
        return resolve(address, fromBlock, toBlock);
    }
    _getTransactionRequest(_request) {
        const request = (0,_provider_js__WEBPACK_IMPORTED_MODULE_6__.copyRequest)(_request);
        const promises = [];
        ["to", "from"].forEach((key) => {
            if (request[key] == null) {
                return;
            }
            const addr = (0,_address_index_js__WEBPACK_IMPORTED_MODULE_2__.resolveAddress)(request[key]);
            if (isPromise(addr)) {
                promises.push((async function () { request[key] = await addr; })());
            }
            else {
                request[key] = addr;
            }
        });
        if (request.blockTag != null) {
            const blockTag = this._getBlockTag(request.blockTag);
            if (isPromise(blockTag)) {
                promises.push((async function () { request.blockTag = await blockTag; })());
            }
            else {
                request.blockTag = blockTag;
            }
        }
        if (promises.length) {
            return (async function () {
                await Promise.all(promises);
                return request;
            })();
        }
        return request;
    }
    async getNetwork() {
        // No explicit network was set and this is our first time
        if (this.#networkPromise == null) {
            // Detect the current network (shared with all calls)
            const detectNetwork = this._detectNetwork().then((network) => {
                this.emit("network", network, null);
                return network;
            }, (error) => {
                // Reset the networkPromise on failure, so we will try again
                if (this.#networkPromise === detectNetwork) {
                    this.#networkPromise = null;
                }
                throw error;
            });
            this.#networkPromise = detectNetwork;
            return (await detectNetwork).clone();
        }
        const networkPromise = this.#networkPromise;
        const [expected, actual] = await Promise.all([
            networkPromise,
            this._detectNetwork() // The actual connected network
        ]);
        if (expected.chainId !== actual.chainId) {
            if (this.#anyNetwork) {
                // The "any" network can change, so notify listeners
                this.emit("network", actual, expected);
                // Update the network if something else hasn't already changed it
                if (this.#networkPromise === networkPromise) {
                    this.#networkPromise = Promise.resolve(actual);
                }
            }
            else {
                // Otherwise, we do not allow changes to the underlying network
                (0,_utils_index_js__WEBPACK_IMPORTED_MODULE_3__.assert)(false, `network changed: ${expected.chainId} => ${actual.chainId} `, "NETWORK_ERROR", {
                    event: "changed"
                });
            }
        }
        return expected.clone();
    }
    async getFeeData() {
        const { block, gasPrice } = await (0,_utils_index_js__WEBPACK_IMPORTED_MODULE_0__.resolveProperties)({
            block: this.getBlock("latest"),
            gasPrice: ((async () => {
                try {
                    const gasPrice = await this.#perform({ method: "getGasPrice" });
                    return (0,_utils_index_js__WEBPACK_IMPORTED_MODULE_8__.getBigInt)(gasPrice, "%response");
                }
                catch (error) { }
                return null;
            })())
        });
        let maxFeePerGas = null, maxPriorityFeePerGas = null;
        if (block && block.baseFeePerGas) {
            // We may want to compute this more accurately in the future,
            // using the formula "check if the base fee is correct".
            // See: https://eips.ethereum.org/EIPS/eip-1559
            maxPriorityFeePerGas = BigInt("1000000000");
            // Allow a network to override their maximum priority fee per gas
            //const priorityFeePlugin = (await this.getNetwork()).getPlugin<MaxPriorityFeePlugin>("org.ethers.plugins.max-priority-fee");
            //if (priorityFeePlugin) {
            //    maxPriorityFeePerGas = await priorityFeePlugin.getPriorityFee(this);
            //}
            maxFeePerGas = (block.baseFeePerGas * BN_2) + maxPriorityFeePerGas;
        }
        return new _provider_js__WEBPACK_IMPORTED_MODULE_6__.FeeData(gasPrice, maxFeePerGas, maxPriorityFeePerGas);
    }
    async estimateGas(_tx) {
        let tx = this._getTransactionRequest(_tx);
        if (isPromise(tx)) {
            tx = await tx;
        }
        return (0,_utils_index_js__WEBPACK_IMPORTED_MODULE_8__.getBigInt)(await this.#perform({
            method: "estimateGas", transaction: tx
        }), "%response");
    }
    async #call(tx, blockTag, attempt) {
        (0,_utils_index_js__WEBPACK_IMPORTED_MODULE_3__.assert)(attempt < MAX_CCIP_REDIRECTS, "CCIP read exceeded maximum redirections", "OFFCHAIN_FAULT", {
            reason: "TOO_MANY_REDIRECTS",
            transaction: Object.assign({}, tx, { blockTag, enableCcipRead: true })
        });
        // This came in as a PerformActionTransaction, so to/from are safe; we can cast
        const transaction = (0,_provider_js__WEBPACK_IMPORTED_MODULE_6__.copyRequest)(tx);
        try {
            return (0,_utils_index_js__WEBPACK_IMPORTED_MODULE_1__.hexlify)(await this._perform({ method: "call", transaction, blockTag }));
        }
        catch (error) {
            // CCIP Read OffchainLookup
            if (!this.disableCcipRead && (0,_utils_index_js__WEBPACK_IMPORTED_MODULE_3__.isCallException)(error) && error.data && attempt >= 0 && blockTag === "latest" && transaction.to != null && (0,_utils_index_js__WEBPACK_IMPORTED_MODULE_1__.dataSlice)(error.data, 0, 4) === "0x556f1830") {
                const data = error.data;
                const txSender = await (0,_address_index_js__WEBPACK_IMPORTED_MODULE_2__.resolveAddress)(transaction.to, this);
                // Parse the CCIP Read Arguments
                let ccipArgs;
                try {
                    ccipArgs = parseOffchainLookup((0,_utils_index_js__WEBPACK_IMPORTED_MODULE_1__.dataSlice)(error.data, 4));
                }
                catch (error) {
                    (0,_utils_index_js__WEBPACK_IMPORTED_MODULE_3__.assert)(false, error.message, "OFFCHAIN_FAULT", {
                        reason: "BAD_DATA", transaction, info: { data }
                    });
                }
                // Check the sender of the OffchainLookup matches the transaction
                (0,_utils_index_js__WEBPACK_IMPORTED_MODULE_3__.assert)(ccipArgs.sender.toLowerCase() === txSender.toLowerCase(), "CCIP Read sender mismatch", "CALL_EXCEPTION", {
                    action: "call",
                    data,
                    reason: "OffchainLookup",
                    transaction: transaction,
                    invocation: null,
                    revert: {
                        signature: "OffchainLookup(address,string[],bytes,bytes4,bytes)",
                        name: "OffchainLookup",
                        args: ccipArgs.errorArgs
                    }
                });
                const ccipResult = await this.ccipReadFetch(transaction, ccipArgs.calldata, ccipArgs.urls);
                (0,_utils_index_js__WEBPACK_IMPORTED_MODULE_3__.assert)(ccipResult != null, "CCIP Read failed to fetch data", "OFFCHAIN_FAULT", {
                    reason: "FETCH_FAILED", transaction, info: { data: error.data, errorArgs: ccipArgs.errorArgs }
                });
                const tx = {
                    to: txSender,
                    data: (0,_utils_index_js__WEBPACK_IMPORTED_MODULE_1__.concat)([ccipArgs.selector, encodeBytes([ccipResult, ccipArgs.extraData])])
                };
                this.emit("debug", { action: "sendCcipReadCall", transaction: tx });
                try {
                    const result = await this.#call(tx, blockTag, attempt + 1);
                    this.emit("debug", { action: "receiveCcipReadCallResult", transaction: Object.assign({}, tx), result });
                    return result;
                }
                catch (error) {
                    this.emit("debug", { action: "receiveCcipReadCallError", transaction: Object.assign({}, tx), error });
                    throw error;
                }
            }
            throw error;
        }
    }
    async #checkNetwork(promise) {
        const { value } = await (0,_utils_index_js__WEBPACK_IMPORTED_MODULE_0__.resolveProperties)({
            network: this.getNetwork(),
            value: promise
        });
        return value;
    }
    async call(_tx) {
        const { tx, blockTag } = await (0,_utils_index_js__WEBPACK_IMPORTED_MODULE_0__.resolveProperties)({
            tx: this._getTransactionRequest(_tx),
            blockTag: this._getBlockTag(_tx.blockTag)
        });
        return await this.#checkNetwork(this.#call(tx, blockTag, _tx.enableCcipRead ? 0 : -1));
    }
    // Account
    async #getAccountValue(request, _address, _blockTag) {
        let address = this._getAddress(_address);
        let blockTag = this._getBlockTag(_blockTag);
        if (typeof (address) !== "string" || typeof (blockTag) !== "string") {
            [address, blockTag] = await Promise.all([address, blockTag]);
        }
        return await this.#checkNetwork(this.#perform(Object.assign(request, { address, blockTag })));
    }
    async getBalance(address, blockTag) {
        return (0,_utils_index_js__WEBPACK_IMPORTED_MODULE_8__.getBigInt)(await this.#getAccountValue({ method: "getBalance" }, address, blockTag), "%response");
    }
    async getTransactionCount(address, blockTag) {
        return (0,_utils_index_js__WEBPACK_IMPORTED_MODULE_8__.getNumber)(await this.#getAccountValue({ method: "getTransactionCount" }, address, blockTag), "%response");
    }
    async getCode(address, blockTag) {
        return (0,_utils_index_js__WEBPACK_IMPORTED_MODULE_1__.hexlify)(await this.#getAccountValue({ method: "getCode" }, address, blockTag));
    }
    async getStorage(address, _position, blockTag) {
        const position = (0,_utils_index_js__WEBPACK_IMPORTED_MODULE_8__.getBigInt)(_position, "position");
        return (0,_utils_index_js__WEBPACK_IMPORTED_MODULE_1__.hexlify)(await this.#getAccountValue({ method: "getStorage", position }, address, blockTag));
    }
    // Write
    async broadcastTransaction(signedTx) {
        const { blockNumber, hash, network } = await (0,_utils_index_js__WEBPACK_IMPORTED_MODULE_0__.resolveProperties)({
            blockNumber: this.getBlockNumber(),
            hash: this._perform({
                method: "broadcastTransaction",
                signedTransaction: signedTx
            }),
            network: this.getNetwork()
        });
        const tx = _transaction_index_js__WEBPACK_IMPORTED_MODULE_9__.Transaction.from(signedTx);
        if (tx.hash !== hash) {
            throw new Error("@TODO: the returned hash did not match");
        }
        return this._wrapTransactionResponse(tx, network).replaceableTransaction(blockNumber);
    }
    async #getBlock(block, includeTransactions) {
        // @TODO: Add CustomBlockPlugin check
        if ((0,_utils_index_js__WEBPACK_IMPORTED_MODULE_1__.isHexString)(block, 32)) {
            return await this.#perform({
                method: "getBlock", blockHash: block, includeTransactions
            });
        }
        let blockTag = this._getBlockTag(block);
        if (typeof (blockTag) !== "string") {
            blockTag = await blockTag;
        }
        return await this.#perform({
            method: "getBlock", blockTag, includeTransactions
        });
    }
    // Queries
    async getBlock(block, prefetchTxs) {
        const { network, params } = await (0,_utils_index_js__WEBPACK_IMPORTED_MODULE_0__.resolveProperties)({
            network: this.getNetwork(),
            params: this.#getBlock(block, !!prefetchTxs)
        });
        if (params == null) {
            return null;
        }
        return this._wrapBlock((0,_format_js__WEBPACK_IMPORTED_MODULE_7__.formatBlock)(params), network);
    }
    async getTransaction(hash) {
        const { network, params } = await (0,_utils_index_js__WEBPACK_IMPORTED_MODULE_0__.resolveProperties)({
            network: this.getNetwork(),
            params: this.#perform({ method: "getTransaction", hash })
        });
        if (params == null) {
            return null;
        }
        return this._wrapTransactionResponse((0,_format_js__WEBPACK_IMPORTED_MODULE_7__.formatTransactionResponse)(params), network);
    }
    async getTransactionReceipt(hash) {
        const { network, params } = await (0,_utils_index_js__WEBPACK_IMPORTED_MODULE_0__.resolveProperties)({
            network: this.getNetwork(),
            params: this.#perform({ method: "getTransactionReceipt", hash })
        });
        if (params == null) {
            return null;
        }
        // Some backends did not backfill the effectiveGasPrice into old transactions
        // in the receipt, so we look it up manually and inject it.
        if (params.gasPrice == null && params.effectiveGasPrice == null) {
            const tx = await this.#perform({ method: "getTransaction", hash });
            if (tx == null) {
                throw new Error("report this; could not find tx or effectiveGasPrice");
            }
            params.effectiveGasPrice = tx.gasPrice;
        }
        return this._wrapTransactionReceipt((0,_format_js__WEBPACK_IMPORTED_MODULE_7__.formatTransactionReceipt)(params), network);
    }
    async getTransactionResult(hash) {
        const { result } = await (0,_utils_index_js__WEBPACK_IMPORTED_MODULE_0__.resolveProperties)({
            network: this.getNetwork(),
            result: this.#perform({ method: "getTransactionResult", hash })
        });
        if (result == null) {
            return null;
        }
        return (0,_utils_index_js__WEBPACK_IMPORTED_MODULE_1__.hexlify)(result);
    }
    // Bloom-filter Queries
    async getLogs(_filter) {
        let filter = this._getFilter(_filter);
        if (isPromise(filter)) {
            filter = await filter;
        }
        const { network, params } = await (0,_utils_index_js__WEBPACK_IMPORTED_MODULE_0__.resolveProperties)({
            network: this.getNetwork(),
            params: this.#perform({ method: "getLogs", filter })
        });
        return params.map((p) => this._wrapLog((0,_format_js__WEBPACK_IMPORTED_MODULE_7__.formatLog)(p), network));
    }
    // ENS
    _getProvider(chainId) {
        (0,_utils_index_js__WEBPACK_IMPORTED_MODULE_3__.assert)(false, "provider cannot connect to target network", "UNSUPPORTED_OPERATION", {
            operation: "_getProvider()"
        });
    }
    async getResolver(name) {
        return await _ens_resolver_js__WEBPACK_IMPORTED_MODULE_10__.EnsResolver.fromName(this, name);
    }
    async getAvatar(name) {
        const resolver = await this.getResolver(name);
        if (resolver) {
            return await resolver.getAvatar();
        }
        return null;
    }
    async resolveName(name) {
        const resolver = await this.getResolver(name);
        if (resolver) {
            return await resolver.getAddress();
        }
        return null;
    }
    async lookupAddress(address) {
        address = (0,_address_index_js__WEBPACK_IMPORTED_MODULE_11__.getAddress)(address);
        const node = (0,_hash_index_js__WEBPACK_IMPORTED_MODULE_12__.namehash)(address.substring(2).toLowerCase() + ".addr.reverse");
        try {
            const ensAddr = await _ens_resolver_js__WEBPACK_IMPORTED_MODULE_10__.EnsResolver.getEnsAddress(this);
            const ensContract = new _contract_index_js__WEBPACK_IMPORTED_MODULE_13__.Contract(ensAddr, [
                "function resolver(bytes32) view returns (address)"
            ], this);
            const resolver = await ensContract.resolver(node);
            if (resolver == null || resolver === _constants_index_js__WEBPACK_IMPORTED_MODULE_14__.ZeroHash) {
                return null;
            }
            const resolverContract = new _contract_index_js__WEBPACK_IMPORTED_MODULE_13__.Contract(resolver, [
                "function name(bytes32) view returns (string)"
            ], this);
            const name = await resolverContract.name(node);
            // Failed forward resolution
            const check = await this.resolveName(name);
            if (check !== address) {
                return null;
            }
            return name;
        }
        catch (error) {
            // No data was returned from the resolver
            if ((0,_utils_index_js__WEBPACK_IMPORTED_MODULE_3__.isError)(error, "BAD_DATA") && error.value === "0x") {
                return null;
            }
            // Something reerted
            if ((0,_utils_index_js__WEBPACK_IMPORTED_MODULE_3__.isError)(error, "CALL_EXCEPTION")) {
                return null;
            }
            throw error;
        }
        return null;
    }
    async waitForTransaction(hash, _confirms, timeout) {
        const confirms = (_confirms != null) ? _confirms : 1;
        if (confirms === 0) {
            return this.getTransactionReceipt(hash);
        }
        return new Promise(async (resolve, reject) => {
            let timer = null;
            const listener = (async (blockNumber) => {
                try {
                    const receipt = await this.getTransactionReceipt(hash);
                    if (receipt != null) {
                        if (blockNumber - receipt.blockNumber + 1 >= confirms) {
                            resolve(receipt);
                            //this.off("block", listener);
                            if (timer) {
                                clearTimeout(timer);
                                timer = null;
                            }
                            return;
                        }
                    }
                }
                catch (error) {
                    console.log("EEE", error);
                }
                this.once("block", listener);
            });
            if (timeout != null) {
                timer = setTimeout(() => {
                    if (timer == null) {
                        return;
                    }
                    timer = null;
                    this.off("block", listener);
                    reject((0,_utils_index_js__WEBPACK_IMPORTED_MODULE_3__.makeError)("timeout", "TIMEOUT", { reason: "timeout" }));
                }, timeout);
            }
            listener(await this.getBlockNumber());
        });
    }
    async waitForBlock(blockTag) {
        (0,_utils_index_js__WEBPACK_IMPORTED_MODULE_3__.assert)(false, "not implemented yet", "NOT_IMPLEMENTED", {
            operation: "waitForBlock"
        });
    }
    _clearTimeout(timerId) {
        const timer = this.#timers.get(timerId);
        if (!timer) {
            return;
        }
        if (timer.timer) {
            clearTimeout(timer.timer);
        }
        this.#timers.delete(timerId);
    }
    _setTimeout(_func, timeout) {
        if (timeout == null) {
            timeout = 0;
        }
        const timerId = this.#nextTimer++;
        const func = () => {
            this.#timers.delete(timerId);
            _func();
        };
        if (this.paused) {
            this.#timers.set(timerId, { timer: null, func, time: timeout });
        }
        else {
            const timer = setTimeout(func, timeout);
            this.#timers.set(timerId, { timer, func, time: getTime() });
        }
        return timerId;
    }
    _forEachSubscriber(func) {
        for (const sub of this.#subs.values()) {
            func(sub.subscriber);
        }
    }
    // Event API; sub-classes should override this; any supported
    // event filter will have been munged into an EventFilter
    _getSubscriber(sub) {
        switch (sub.type) {
            case "debug":
            case "network":
                return new UnmanagedSubscriber(sub.type);
            case "block":
                return new _subscriber_polling_js__WEBPACK_IMPORTED_MODULE_15__.PollingBlockSubscriber(this);
            case "event":
                return new _subscriber_polling_js__WEBPACK_IMPORTED_MODULE_15__.PollingEventSubscriber(this, sub.filter);
            case "transaction":
                return new _subscriber_polling_js__WEBPACK_IMPORTED_MODULE_15__.PollingTransactionSubscriber(this, sub.hash);
            case "orphan":
                return new _subscriber_polling_js__WEBPACK_IMPORTED_MODULE_15__.PollingOrphanSubscriber(this, sub.filter);
        }
        throw new Error(`unsupported event: ${sub.type}`);
    }
    _recoverSubscriber(oldSub, newSub) {
        for (const sub of this.#subs.values()) {
            if (sub.subscriber === oldSub) {
                if (sub.started) {
                    sub.subscriber.stop();
                }
                sub.subscriber = newSub;
                if (sub.started) {
                    newSub.start();
                }
                if (this.#pausedState != null) {
                    newSub.pause(this.#pausedState);
                }
                break;
            }
        }
    }
    async #hasSub(event, emitArgs) {
        let sub = await getSubscription(event, this);
        // This is a log that is removing an existing log; we actually want
        // to emit an orphan event for the removed log
        if (sub.type === "event" && emitArgs && emitArgs.length > 0 && emitArgs[0].removed === true) {
            sub = await getSubscription({ orphan: "drop-log", log: emitArgs[0] }, this);
        }
        return this.#subs.get(sub.tag) || null;
    }
    async #getSub(event) {
        const subscription = await getSubscription(event, this);
        // Prevent tampering with our tag in any subclass' _getSubscriber
        const tag = subscription.tag;
        let sub = this.#subs.get(tag);
        if (!sub) {
            const subscriber = this._getSubscriber(subscription);
            const addressableMap = new WeakMap();
            const nameMap = new Map();
            sub = { subscriber, tag, addressableMap, nameMap, started: false, listeners: [] };
            this.#subs.set(tag, sub);
        }
        return sub;
    }
    async on(event, listener) {
        const sub = await this.#getSub(event);
        sub.listeners.push({ listener, once: false });
        if (!sub.started) {
            sub.subscriber.start();
            sub.started = true;
            if (this.#pausedState != null) {
                sub.subscriber.pause(this.#pausedState);
            }
        }
        return this;
    }
    async once(event, listener) {
        const sub = await this.#getSub(event);
        sub.listeners.push({ listener, once: true });
        if (!sub.started) {
            sub.subscriber.start();
            sub.started = true;
            if (this.#pausedState != null) {
                sub.subscriber.pause(this.#pausedState);
            }
        }
        return this;
    }
    async emit(event, ...args) {
        const sub = await this.#hasSub(event, args);
        // If there is not subscription or if a recent emit removed
        // the last of them (which also deleted the sub) do nothing
        if (!sub || sub.listeners.length === 0) {
            return false;
        }
        ;
        const count = sub.listeners.length;
        sub.listeners = sub.listeners.filter(({ listener, once }) => {
            const payload = new _utils_index_js__WEBPACK_IMPORTED_MODULE_16__.EventPayload(this, (once ? null : listener), event);
            try {
                listener.call(this, ...args, payload);
            }
            catch (error) { }
            return !once;
        });
        if (sub.listeners.length === 0) {
            if (sub.started) {
                sub.subscriber.stop();
            }
            this.#subs.delete(sub.tag);
        }
        return (count > 0);
    }
    async listenerCount(event) {
        if (event) {
            const sub = await this.#hasSub(event);
            if (!sub) {
                return 0;
            }
            return sub.listeners.length;
        }
        let total = 0;
        for (const { listeners } of this.#subs.values()) {
            total += listeners.length;
        }
        return total;
    }
    async listeners(event) {
        if (event) {
            const sub = await this.#hasSub(event);
            if (!sub) {
                return [];
            }
            return sub.listeners.map(({ listener }) => listener);
        }
        let result = [];
        for (const { listeners } of this.#subs.values()) {
            result = result.concat(listeners.map(({ listener }) => listener));
        }
        return result;
    }
    async off(event, listener) {
        const sub = await this.#hasSub(event);
        if (!sub) {
            return this;
        }
        if (listener) {
            const index = sub.listeners.map(({ listener }) => listener).indexOf(listener);
            if (index >= 0) {
                sub.listeners.splice(index, 1);
            }
        }
        if (!listener || sub.listeners.length === 0) {
            if (sub.started) {
                sub.subscriber.stop();
            }
            this.#subs.delete(sub.tag);
        }
        return this;
    }
    async removeAllListeners(event) {
        if (event) {
            const { tag, started, subscriber } = await this.#getSub(event);
            if (started) {
                subscriber.stop();
            }
            this.#subs.delete(tag);
        }
        else {
            for (const [tag, { started, subscriber }] of this.#subs) {
                if (started) {
                    subscriber.stop();
                }
                this.#subs.delete(tag);
            }
        }
        return this;
    }
    // Alias for "on"
    async addListener(event, listener) {
        return await this.on(event, listener);
    }
    // Alias for "off"
    async removeListener(event, listener) {
        return this.off(event, listener);
    }
    // Sub-classes should override this to shutdown any sockets, etc.
    // but MUST call this super.shutdown.
    destroy() {
        // Stop all listeners
        this.removeAllListeners();
        // Shut down all tiemrs
        for (const timerId of this.#timers.keys()) {
            this._clearTimeout(timerId);
        }
    }
    get paused() { return (this.#pausedState != null); }
    set paused(pause) {
        if (!!pause === this.paused) {
            return;
        }
        if (this.paused) {
            this.resume();
        }
        else {
            this.pause(false);
        }
    }
    pause(dropWhilePaused) {
        this.#lastBlockNumber = -1;
        if (this.#pausedState != null) {
            if (this.#pausedState == !!dropWhilePaused) {
                return;
            }
            (0,_utils_index_js__WEBPACK_IMPORTED_MODULE_3__.assert)(false, "cannot change pause type; resume first", "UNSUPPORTED_OPERATION", {
                operation: "pause"
            });
        }
        this._forEachSubscriber((s) => s.pause(dropWhilePaused));
        this.#pausedState = !!dropWhilePaused;
        for (const timer of this.#timers.values()) {
            // Clear the timer
            if (timer.timer) {
                clearTimeout(timer.timer);
            }
            // Remaining time needed for when we become unpaused
            timer.time = getTime() - timer.time;
        }
    }
    resume() {
        if (this.#pausedState == null) {
            return;
        }
        this._forEachSubscriber((s) => s.resume());
        this.#pausedState = null;
        for (const timer of this.#timers.values()) {
            // Remaining time when we were paused
            let timeout = timer.time;
            if (timeout < 0) {
                timeout = 0;
            }
            // Start time (in cause paused, so we con compute remaininf time)
            timer.time = getTime();
            // Start the timer
            setTimeout(timer.func, timeout);
        }
    }
}
function _parseString(result, start) {
    try {
        const bytes = _parseBytes(result, start);
        if (bytes) {
            return (0,_utils_index_js__WEBPACK_IMPORTED_MODULE_17__.toUtf8String)(bytes);
        }
    }
    catch (error) { }
    return null;
}
function _parseBytes(result, start) {
    if (result === "0x") {
        return null;
    }
    try {
        const offset = (0,_utils_index_js__WEBPACK_IMPORTED_MODULE_8__.getNumber)((0,_utils_index_js__WEBPACK_IMPORTED_MODULE_1__.dataSlice)(result, start, start + 32));
        const length = (0,_utils_index_js__WEBPACK_IMPORTED_MODULE_8__.getNumber)((0,_utils_index_js__WEBPACK_IMPORTED_MODULE_1__.dataSlice)(result, offset, offset + 32));
        return (0,_utils_index_js__WEBPACK_IMPORTED_MODULE_1__.dataSlice)(result, offset + 32, offset + 32 + length);
    }
    catch (error) { }
    return null;
}
function numPad(value) {
    const result = (0,_utils_index_js__WEBPACK_IMPORTED_MODULE_8__.toBeArray)(value);
    if (result.length > 32) {
        throw new Error("internal; should not happen");
    }
    const padded = new Uint8Array(32);
    padded.set(result, 32 - result.length);
    return padded;
}
function bytesPad(value) {
    if ((value.length % 32) === 0) {
        return value;
    }
    const result = new Uint8Array(Math.ceil(value.length / 32) * 32);
    result.set(value);
    return result;
}
const empty = new Uint8Array([]);
// ABI Encodes a series of (bytes, bytes, ...)
function encodeBytes(datas) {
    const result = [];
    let byteCount = 0;
    // Add place-holders for pointers as we add items
    for (let i = 0; i < datas.length; i++) {
        result.push(empty);
        byteCount += 32;
    }
    for (let i = 0; i < datas.length; i++) {
        const data = (0,_utils_index_js__WEBPACK_IMPORTED_MODULE_1__.getBytes)(datas[i]);
        // Update the bytes offset
        result[i] = numPad(byteCount);
        // The length and padded value of data
        result.push(numPad(data.length));
        result.push(bytesPad(data));
        byteCount += 32 + Math.ceil(data.length / 32) * 32;
    }
    return (0,_utils_index_js__WEBPACK_IMPORTED_MODULE_1__.concat)(result);
}
const zeros = "0x0000000000000000000000000000000000000000000000000000000000000000";
function parseOffchainLookup(data) {
    const result = {
        sender: "", urls: [], calldata: "", selector: "", extraData: "", errorArgs: []
    };
    (0,_utils_index_js__WEBPACK_IMPORTED_MODULE_3__.assert)((0,_utils_index_js__WEBPACK_IMPORTED_MODULE_1__.dataLength)(data) >= 5 * 32, "insufficient OffchainLookup data", "OFFCHAIN_FAULT", {
        reason: "insufficient OffchainLookup data"
    });
    const sender = (0,_utils_index_js__WEBPACK_IMPORTED_MODULE_1__.dataSlice)(data, 0, 32);
    (0,_utils_index_js__WEBPACK_IMPORTED_MODULE_3__.assert)((0,_utils_index_js__WEBPACK_IMPORTED_MODULE_1__.dataSlice)(sender, 0, 12) === (0,_utils_index_js__WEBPACK_IMPORTED_MODULE_1__.dataSlice)(zeros, 0, 12), "corrupt OffchainLookup sender", "OFFCHAIN_FAULT", {
        reason: "corrupt OffchainLookup sender"
    });
    result.sender = (0,_utils_index_js__WEBPACK_IMPORTED_MODULE_1__.dataSlice)(sender, 12);
    // Read the URLs from the response
    try {
        const urls = [];
        const urlsOffset = (0,_utils_index_js__WEBPACK_IMPORTED_MODULE_8__.getNumber)((0,_utils_index_js__WEBPACK_IMPORTED_MODULE_1__.dataSlice)(data, 32, 64));
        const urlsLength = (0,_utils_index_js__WEBPACK_IMPORTED_MODULE_8__.getNumber)((0,_utils_index_js__WEBPACK_IMPORTED_MODULE_1__.dataSlice)(data, urlsOffset, urlsOffset + 32));
        const urlsData = (0,_utils_index_js__WEBPACK_IMPORTED_MODULE_1__.dataSlice)(data, urlsOffset + 32);
        for (let u = 0; u < urlsLength; u++) {
            const url = _parseString(urlsData, u * 32);
            if (url == null) {
                throw new Error("abort");
            }
            urls.push(url);
        }
        result.urls = urls;
    }
    catch (error) {
        (0,_utils_index_js__WEBPACK_IMPORTED_MODULE_3__.assert)(false, "corrupt OffchainLookup urls", "OFFCHAIN_FAULT", {
            reason: "corrupt OffchainLookup urls"
        });
    }
    // Get the CCIP calldata to forward
    try {
        const calldata = _parseBytes(data, 64);
        if (calldata == null) {
            throw new Error("abort");
        }
        result.calldata = calldata;
    }
    catch (error) {
        (0,_utils_index_js__WEBPACK_IMPORTED_MODULE_3__.assert)(false, "corrupt OffchainLookup calldata", "OFFCHAIN_FAULT", {
            reason: "corrupt OffchainLookup calldata"
        });
    }
    // Get the callbackSelector (bytes4)
    (0,_utils_index_js__WEBPACK_IMPORTED_MODULE_3__.assert)((0,_utils_index_js__WEBPACK_IMPORTED_MODULE_1__.dataSlice)(data, 100, 128) === (0,_utils_index_js__WEBPACK_IMPORTED_MODULE_1__.dataSlice)(zeros, 0, 28), "corrupt OffchainLookup callbaackSelector", "OFFCHAIN_FAULT", {
        reason: "corrupt OffchainLookup callbaackSelector"
    });
    result.selector = (0,_utils_index_js__WEBPACK_IMPORTED_MODULE_1__.dataSlice)(data, 96, 100);
    // Get the extra data to send back to the contract as context
    try {
        const extraData = _parseBytes(data, 128);
        if (extraData == null) {
            throw new Error("abort");
        }
        result.extraData = extraData;
    }
    catch (error) {
        (0,_utils_index_js__WEBPACK_IMPORTED_MODULE_3__.assert)(false, "corrupt OffchainLookup extraData", "OFFCHAIN_FAULT", {
            reason: "corrupt OffchainLookup extraData"
        });
    }
    result.errorArgs = "sender,urls,calldata,selector,extraData".split(/,/).map((k) => result[k]);
    return result;
}
//# sourceMappingURL=abstract-provider.js.map

/***/ }),

/***/ "./node_modules/ethers/lib.esm/providers/abstract-signer.js":
/*!******************************************************************!*\
  !*** ./node_modules/ethers/lib.esm/providers/abstract-signer.js ***!
  \******************************************************************/
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "AbstractSigner": () => (/* binding */ AbstractSigner),
/* harmony export */   "VoidSigner": () => (/* binding */ VoidSigner)
/* harmony export */ });
/* harmony import */ var _address_index_js__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ../address/index.js */ "./node_modules/ethers/lib.esm/address/checks.js");
/* harmony import */ var _transaction_index_js__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! ../transaction/index.js */ "./node_modules/ethers/lib.esm/transaction/transaction.js");
/* harmony import */ var _utils_index_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../utils/index.js */ "./node_modules/ethers/lib.esm/utils/errors.js");
/* harmony import */ var _utils_index_js__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ../utils/index.js */ "./node_modules/ethers/lib.esm/utils/properties.js");
/* harmony import */ var _utils_index_js__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ../utils/index.js */ "./node_modules/ethers/lib.esm/utils/maths.js");
/* harmony import */ var _provider_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./provider.js */ "./node_modules/ethers/lib.esm/providers/provider.js");
/**
 *  About Abstract Signer and subclassing
 *
 *  @_section: api/providers/abstract-signer: Subclassing Signer [abstract-signer]
 */




function checkProvider(signer, operation) {
    if (signer.provider) {
        return signer.provider;
    }
    (0,_utils_index_js__WEBPACK_IMPORTED_MODULE_0__.assert)(false, "missing provider", "UNSUPPORTED_OPERATION", { operation });
}
async function populate(signer, tx) {
    let pop = (0,_provider_js__WEBPACK_IMPORTED_MODULE_1__.copyRequest)(tx);
    if (pop.to != null) {
        pop.to = (0,_address_index_js__WEBPACK_IMPORTED_MODULE_2__.resolveAddress)(pop.to, signer);
    }
    if (pop.from != null) {
        const from = pop.from;
        pop.from = Promise.all([
            signer.getAddress(),
            (0,_address_index_js__WEBPACK_IMPORTED_MODULE_2__.resolveAddress)(from, signer)
        ]).then(([address, from]) => {
            (0,_utils_index_js__WEBPACK_IMPORTED_MODULE_0__.assertArgument)(address.toLowerCase() === from.toLowerCase(), "transaction from mismatch", "tx.from", from);
            return address;
        });
    }
    else {
        pop.from = signer.getAddress();
    }
    return await (0,_utils_index_js__WEBPACK_IMPORTED_MODULE_3__.resolveProperties)(pop);
}
class AbstractSigner {
    provider;
    constructor(provider) {
        (0,_utils_index_js__WEBPACK_IMPORTED_MODULE_3__.defineProperties)(this, { provider: (provider || null) });
    }
    async getNonce(blockTag) {
        return checkProvider(this, "getTransactionCount").getTransactionCount(await this.getAddress(), blockTag);
    }
    async populateCall(tx) {
        const pop = await populate(this, tx);
        return pop;
    }
    async populateTransaction(tx) {
        const provider = checkProvider(this, "populateTransaction");
        const pop = await populate(this, tx);
        if (pop.nonce == null) {
            pop.nonce = await this.getNonce("pending");
        }
        if (pop.gasLimit == null) {
            pop.gasLimit = await this.estimateGas(pop);
        }
        // Populate the chain ID
        const network = await (this.provider).getNetwork();
        if (pop.chainId != null) {
            const chainId = (0,_utils_index_js__WEBPACK_IMPORTED_MODULE_4__.getBigInt)(pop.chainId);
            (0,_utils_index_js__WEBPACK_IMPORTED_MODULE_0__.assertArgument)(chainId === network.chainId, "transaction chainId mismatch", "tx.chainId", tx.chainId);
        }
        else {
            pop.chainId = network.chainId;
        }
        // Do not allow mixing pre-eip-1559 and eip-1559 properties
        const hasEip1559 = (pop.maxFeePerGas != null || pop.maxPriorityFeePerGas != null);
        if (pop.gasPrice != null && (pop.type === 2 || hasEip1559)) {
            (0,_utils_index_js__WEBPACK_IMPORTED_MODULE_0__.assertArgument)(false, "eip-1559 transaction do not support gasPrice", "tx", tx);
        }
        else if ((pop.type === 0 || pop.type === 1) && hasEip1559) {
            (0,_utils_index_js__WEBPACK_IMPORTED_MODULE_0__.assertArgument)(false, "pre-eip-1559 transaction do not support maxFeePerGas/maxPriorityFeePerGas", "tx", tx);
        }
        if ((pop.type === 2 || pop.type == null) && (pop.maxFeePerGas != null && pop.maxPriorityFeePerGas != null)) {
            // Fully-formed EIP-1559 transaction (skip getFeeData)
            pop.type = 2;
        }
        else if (pop.type === 0 || pop.type === 1) {
            // Explicit Legacy or EIP-2930 transaction
            // We need to get fee data to determine things
            const feeData = await provider.getFeeData();
            (0,_utils_index_js__WEBPACK_IMPORTED_MODULE_0__.assert)(feeData.gasPrice != null, "network does not support gasPrice", "UNSUPPORTED_OPERATION", {
                operation: "getGasPrice"
            });
            // Populate missing gasPrice
            if (pop.gasPrice == null) {
                pop.gasPrice = feeData.gasPrice;
            }
        }
        else {
            // We need to get fee data to determine things
            const feeData = await provider.getFeeData();
            if (pop.type == null) {
                // We need to auto-detect the intended type of this transaction...
                if (feeData.maxFeePerGas != null && feeData.maxPriorityFeePerGas != null) {
                    // The network supports EIP-1559!
                    // Upgrade transaction from null to eip-1559
                    pop.type = 2;
                    if (pop.gasPrice != null) {
                        // Using legacy gasPrice property on an eip-1559 network,
                        // so use gasPrice as both fee properties
                        const gasPrice = pop.gasPrice;
                        delete pop.gasPrice;
                        pop.maxFeePerGas = gasPrice;
                        pop.maxPriorityFeePerGas = gasPrice;
                    }
                    else {
                        // Populate missing fee data
                        if (pop.maxFeePerGas == null) {
                            pop.maxFeePerGas = feeData.maxFeePerGas;
                        }
                        if (pop.maxPriorityFeePerGas == null) {
                            pop.maxPriorityFeePerGas = feeData.maxPriorityFeePerGas;
                        }
                    }
                }
                else if (feeData.gasPrice != null) {
                    // Network doesn't support EIP-1559...
                    // ...but they are trying to use EIP-1559 properties
                    (0,_utils_index_js__WEBPACK_IMPORTED_MODULE_0__.assert)(!hasEip1559, "network does not support EIP-1559", "UNSUPPORTED_OPERATION", {
                        operation: "populateTransaction"
                    });
                    // Populate missing fee data
                    if (pop.gasPrice == null) {
                        pop.gasPrice = feeData.gasPrice;
                    }
                    // Explicitly set untyped transaction to legacy
                    // @TODO: Maybe this shold allow type 1?
                    pop.type = 0;
                }
                else {
                    // getFeeData has failed us.
                    (0,_utils_index_js__WEBPACK_IMPORTED_MODULE_0__.assert)(false, "failed to get consistent fee data", "UNSUPPORTED_OPERATION", {
                        operation: "signer.getFeeData"
                    });
                }
            }
            else if (pop.type === 2) {
                // Explicitly using EIP-1559
                // Populate missing fee data
                if (pop.maxFeePerGas == null) {
                    pop.maxFeePerGas = feeData.maxFeePerGas;
                }
                if (pop.maxPriorityFeePerGas == null) {
                    pop.maxPriorityFeePerGas = feeData.maxPriorityFeePerGas;
                }
            }
        }
        //@TOOD: Don't await all over the place; save them up for
        // the end for better batching
        return await (0,_utils_index_js__WEBPACK_IMPORTED_MODULE_3__.resolveProperties)(pop);
    }
    async estimateGas(tx) {
        return checkProvider(this, "estimateGas").estimateGas(await this.populateCall(tx));
    }
    async call(tx) {
        return checkProvider(this, "call").call(await this.populateCall(tx));
    }
    async resolveName(name) {
        const provider = checkProvider(this, "resolveName");
        return await provider.resolveName(name);
    }
    async sendTransaction(tx) {
        const provider = checkProvider(this, "sendTransaction");
        const pop = await this.populateTransaction(tx);
        delete pop.from;
        const txObj = _transaction_index_js__WEBPACK_IMPORTED_MODULE_5__.Transaction.from(pop);
        return await provider.broadcastTransaction(await this.signTransaction(txObj));
    }
}
class VoidSigner extends AbstractSigner {
    address;
    constructor(address, provider) {
        super(provider);
        (0,_utils_index_js__WEBPACK_IMPORTED_MODULE_3__.defineProperties)(this, { address });
    }
    async getAddress() { return this.address; }
    connect(provider) {
        return new VoidSigner(this.address, provider);
    }
    #throwUnsupported(suffix, operation) {
        (0,_utils_index_js__WEBPACK_IMPORTED_MODULE_0__.assert)(false, `VoidSigner cannot sign ${suffix}`, "UNSUPPORTED_OPERATION", { operation });
    }
    async signTransaction(tx) {
        this.#throwUnsupported("transactions", "signTransaction");
    }
    async signMessage(message) {
        this.#throwUnsupported("messages", "signMessage");
    }
    async signTypedData(domain, types, value) {
        this.#throwUnsupported("typed-data", "signTypedData");
    }
}
//# sourceMappingURL=abstract-signer.js.map

/***/ }),

/***/ "./node_modules/ethers/lib.esm/providers/community.js":
/*!************************************************************!*\
  !*** ./node_modules/ethers/lib.esm/providers/community.js ***!
  \************************************************************/
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "showThrottleMessage": () => (/* binding */ showThrottleMessage)
/* harmony export */ });
/**
 *  There are many awesome community services that provide Ethereum
 *  nodes both for developers just starting out and for large-scale
 *  communities.
 *
 *  @_section: api/providers/thirdparty: Community Providers  [thirdparty]
 */
// Show the throttle message only once per service
const shown = new Set();
/**
 *  Displays a warning in tht console when the community resource is
 *  being used too heavily by the app, recommending the developer
 *  acquire their own credentials instead of using the community
 *  credentials.
 *
 *  The notification will only occur once per service.
 */
function showThrottleMessage(service) {
    if (shown.has(service)) {
        return;
    }
    shown.add(service);
    console.log("========= NOTICE =========");
    console.log(`Request-Rate Exceeded for ${service} (this message will not be repeated)`);
    console.log("");
    console.log("The default API keys for each service are provided as a highly-throttled,");
    console.log("community resource for low-traffic projects and early prototyping.");
    console.log("");
    console.log("While your application will continue to function, we highly recommended");
    console.log("signing up for your own API keys to improve performance, increase your");
    console.log("request rate/limit and enable other perks, such as metrics and advanced APIs.");
    console.log("");
    console.log("For more details: https:/\/docs.ethers.org/api-keys/");
    console.log("==========================");
}
//# sourceMappingURL=community.js.map

/***/ }),

/***/ "./node_modules/ethers/lib.esm/providers/default-provider.js":
/*!*******************************************************************!*\
  !*** ./node_modules/ethers/lib.esm/providers/default-provider.js ***!
  \*******************************************************************/
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "getDefaultProvider": () => (/* binding */ getDefaultProvider)
/* harmony export */ });
/* harmony import */ var _utils_index_js__WEBPACK_IMPORTED_MODULE_8__ = __webpack_require__(/*! ../utils/index.js */ "./node_modules/ethers/lib.esm/utils/errors.js");
/* harmony import */ var _provider_ankr_js__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./provider-ankr.js */ "./node_modules/ethers/lib.esm/providers/provider-ankr.js");
/* harmony import */ var _provider_alchemy_js__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./provider-alchemy.js */ "./node_modules/ethers/lib.esm/providers/provider-alchemy.js");
/* harmony import */ var _provider_cloudflare_js__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ./provider-cloudflare.js */ "./node_modules/ethers/lib.esm/providers/provider-cloudflare.js");
/* harmony import */ var _provider_etherscan_js__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! ./provider-etherscan.js */ "./node_modules/ethers/lib.esm/providers/provider-etherscan.js");
/* harmony import */ var _provider_infura_js__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! ./provider-infura.js */ "./node_modules/ethers/lib.esm/providers/provider-infura.js");
/* harmony import */ var _provider_quicknode_js__WEBPACK_IMPORTED_MODULE_7__ = __webpack_require__(/*! ./provider-quicknode.js */ "./node_modules/ethers/lib.esm/providers/provider-quicknode.js");
/* harmony import */ var _provider_fallback_js__WEBPACK_IMPORTED_MODULE_9__ = __webpack_require__(/*! ./provider-fallback.js */ "./node_modules/ethers/lib.esm/providers/provider-fallback.js");
/* harmony import */ var _provider_jsonrpc_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./provider-jsonrpc.js */ "./node_modules/ethers/lib.esm/providers/provider-jsonrpc.js");
/* harmony import */ var _provider_websocket_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./provider-websocket.js */ "./node_modules/ethers/lib.esm/providers/provider-websocket.js");






//import { PocketProvider } from "./provider-pocket.js";




function isWebSocketLike(value) {
    return (value && typeof (value.send) === "function" &&
        typeof (value.close) === "function");
}
function getDefaultProvider(network, options) {
    if (options == null) {
        options = {};
    }
    if (typeof (network) === "string" && network.match(/^https?:/)) {
        return new _provider_jsonrpc_js__WEBPACK_IMPORTED_MODULE_0__.JsonRpcProvider(network);
    }
    if (typeof (network) === "string" && network.match(/^wss?:/) || isWebSocketLike(network)) {
        return new _provider_websocket_js__WEBPACK_IMPORTED_MODULE_1__.WebSocketProvider(network);
    }
    const providers = [];
    if (options.alchemy !== "-") {
        try {
            providers.push(new _provider_alchemy_js__WEBPACK_IMPORTED_MODULE_2__.AlchemyProvider(network, options.alchemy));
        }
        catch (error) {
            console.log(error);
        }
    }
    if (options.ankr !== "-") {
        try {
            providers.push(new _provider_ankr_js__WEBPACK_IMPORTED_MODULE_3__.AnkrProvider(network, options.ankr));
        }
        catch (error) {
            console.log(error);
        }
    }
    if (options.cloudflare !== "-") {
        try {
            providers.push(new _provider_cloudflare_js__WEBPACK_IMPORTED_MODULE_4__.CloudflareProvider(network));
        }
        catch (error) {
            console.log(error);
        }
    }
    if (options.etherscan !== "-") {
        try {
            providers.push(new _provider_etherscan_js__WEBPACK_IMPORTED_MODULE_5__.EtherscanProvider(network, options.etherscan));
        }
        catch (error) {
            console.log(error);
        }
    }
    if (options.infura !== "-") {
        try {
            let projectId = options.infura;
            let projectSecret = undefined;
            if (typeof (projectId) === "object") {
                projectSecret = projectId.projectSecret;
                projectId = projectId.projectId;
            }
            providers.push(new _provider_infura_js__WEBPACK_IMPORTED_MODULE_6__.InfuraProvider(network, projectId, projectSecret));
        }
        catch (error) {
            console.log(error);
        }
    }
    /*
        if (options.pocket !== "-") {
            try {
                let appId = options.pocket;
                let secretKey: undefined | string = undefined;
                let loadBalancer: undefined | boolean = undefined;
                if (typeof(appId) === "object") {
                    loadBalancer = !!appId.loadBalancer;
                    secretKey = appId.secretKey;
                    appId = appId.appId;
                }
                providers.push(new PocketProvider(network, appId, secretKey, loadBalancer));
            } catch (error) { console.log(error); }
        }
    */
    if (options.quicknode !== "-") {
        try {
            let token = options.quicknode;
            providers.push(new _provider_quicknode_js__WEBPACK_IMPORTED_MODULE_7__.QuickNodeProvider(network, token));
        }
        catch (error) {
            console.log(error);
        }
    }
    (0,_utils_index_js__WEBPACK_IMPORTED_MODULE_8__.assert)(providers.length, "unsupported default network", "UNSUPPORTED_OPERATION", {
        operation: "getDefaultProvider"
    });
    if (providers.length === 1) {
        return providers[0];
    }
    return new _provider_fallback_js__WEBPACK_IMPORTED_MODULE_9__.FallbackProvider(providers);
}
//# sourceMappingURL=default-provider.js.map

/***/ }),

/***/ "./node_modules/ethers/lib.esm/providers/ens-resolver.js":
/*!***************************************************************!*\
  !*** ./node_modules/ethers/lib.esm/providers/ens-resolver.js ***!
  \***************************************************************/
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "BasicMulticoinProviderPlugin": () => (/* binding */ BasicMulticoinProviderPlugin),
/* harmony export */   "EnsResolver": () => (/* binding */ EnsResolver),
/* harmony export */   "MulticoinProviderPlugin": () => (/* binding */ MulticoinProviderPlugin)
/* harmony export */ });
/* harmony import */ var _constants_index_js__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ../constants/index.js */ "./node_modules/ethers/lib.esm/constants/addresses.js");
/* harmony import */ var _contract_index_js__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ../contract/index.js */ "./node_modules/ethers/lib.esm/contract/contract.js");
/* harmony import */ var _hash_index_js__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ../hash/index.js */ "./node_modules/ethers/lib.esm/hash/namehash.js");
/* harmony import */ var _utils_index_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../utils/index.js */ "./node_modules/ethers/lib.esm/utils/errors.js");
/* harmony import */ var _utils_index_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../utils/index.js */ "./node_modules/ethers/lib.esm/utils/properties.js");
/* harmony import */ var _utils_index_js__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! ../utils/index.js */ "./node_modules/ethers/lib.esm/utils/base58.js");
/* harmony import */ var _utils_index_js__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! ../utils/index.js */ "./node_modules/ethers/lib.esm/utils/maths.js");
/* harmony import */ var _utils_index_js__WEBPACK_IMPORTED_MODULE_7__ = __webpack_require__(/*! ../utils/index.js */ "./node_modules/ethers/lib.esm/utils/fetch.js");
/* harmony import */ var _utils_index_js__WEBPACK_IMPORTED_MODULE_8__ = __webpack_require__(/*! ../utils/index.js */ "./node_modules/ethers/lib.esm/utils/data.js");
/**
 *  About ENS Resolver
 *
 *  @_section: api/providers/ens-resolver:ENS Resolver  [about-ens-rsolver]
 */




// @TODO: This should use the fetch-data:ipfs gateway
// Trim off the ipfs:// prefix and return the default gateway URL
function getIpfsLink(link) {
    if (link.match(/^ipfs:\/\/ipfs\//i)) {
        link = link.substring(12);
    }
    else if (link.match(/^ipfs:\/\//i)) {
        link = link.substring(7);
    }
    else {
        (0,_utils_index_js__WEBPACK_IMPORTED_MODULE_0__.assertArgument)(false, "unsupported IPFS format", "link", link);
    }
    return `https:/\/gateway.ipfs.io/ipfs/${link}`;
}
;
;
/**
 *  A provider plugin super-class for processing multicoin address types.
 */
class MulticoinProviderPlugin {
    name;
    constructor(name) {
        (0,_utils_index_js__WEBPACK_IMPORTED_MODULE_1__.defineProperties)(this, { name });
    }
    connect(proivder) {
        return this;
    }
    supportsCoinType(coinType) {
        return false;
    }
    async encodeAddress(coinType, address) {
        throw new Error("unsupported coin");
    }
    async decodeAddress(coinType, data) {
        throw new Error("unsupported coin");
    }
}
const BasicMulticoinPluginId = "org.ethers.plugins.provider.BasicMulticoin";
/**
 *  A basic multicoin provider plugin.
 */
class BasicMulticoinProviderPlugin extends MulticoinProviderPlugin {
    constructor() {
        super(BasicMulticoinPluginId);
    }
}
const matcherIpfs = new RegExp("^(ipfs):/\/(.*)$", "i");
const matchers = [
    new RegExp("^(https):/\/(.*)$", "i"),
    new RegExp("^(data):(.*)$", "i"),
    matcherIpfs,
    new RegExp("^eip155:[0-9]+/(erc[0-9]+):(.*)$", "i"),
];
/**
 *  A connected object to a resolved ENS name resolver, which can be
 *  used to query additional details.
 */
class EnsResolver {
    /**
     *  The connected provider.
     */
    provider;
    /**
     *  The address of the resolver.
     */
    address;
    /**
     *  The name this resovler was resolved against.
     */
    name;
    // For EIP-2544 names, the ancestor that provided the resolver
    #supports2544;
    #resolver;
    constructor(provider, address, name) {
        (0,_utils_index_js__WEBPACK_IMPORTED_MODULE_1__.defineProperties)(this, { provider, address, name });
        this.#supports2544 = null;
        this.#resolver = new _contract_index_js__WEBPACK_IMPORTED_MODULE_2__.Contract(address, [
            "function supportsInterface(bytes4) view returns (bool)",
            "function resolve(bytes, bytes) view returns (bytes)",
            "function addr(bytes32) view returns (address)",
            "function addr(bytes32, uint) view returns (address)",
            "function text(bytes32, string) view returns (string)",
            "function contenthash(bytes32) view returns (bytes)",
        ], provider);
    }
    /**
     *  Resolves to true if the resolver supports wildcard resolution.
     */
    async supportsWildcard() {
        if (this.#supports2544 == null) {
            this.#supports2544 = (async () => {
                try {
                    return await this.#resolver.supportsInterface("0x9061b923");
                }
                catch (error) {
                    // Wildcard resolvers must understand supportsInterface
                    // and return true.
                    if ((0,_utils_index_js__WEBPACK_IMPORTED_MODULE_0__.isError)(error, "CALL_EXCEPTION")) {
                        return false;
                    }
                    // Let future attempts try again...
                    this.#supports2544 = null;
                    throw error;
                }
            })();
        }
        return await this.#supports2544;
    }
    async #fetch(funcName, params) {
        params = (params || []).slice();
        const iface = this.#resolver.interface;
        // The first parameters is always the nodehash
        params.unshift((0,_hash_index_js__WEBPACK_IMPORTED_MODULE_3__.namehash)(this.name));
        let fragment = null;
        if (await this.supportsWildcard()) {
            fragment = iface.getFunction(funcName);
            (0,_utils_index_js__WEBPACK_IMPORTED_MODULE_0__.assert)(fragment, "missing fragment", "UNKNOWN_ERROR", {
                info: { funcName }
            });
            params = [
                (0,_hash_index_js__WEBPACK_IMPORTED_MODULE_3__.dnsEncode)(this.name),
                iface.encodeFunctionData(fragment, params)
            ];
            funcName = "resolve(bytes,bytes)";
        }
        params.push({
            ccipReadEnable: true
        });
        try {
            const result = await this.#resolver[funcName](...params);
            if (fragment) {
                return iface.decodeFunctionResult(fragment, result)[0];
            }
            return result;
        }
        catch (error) {
            if (!(0,_utils_index_js__WEBPACK_IMPORTED_MODULE_0__.isError)(error, "CALL_EXCEPTION")) {
                throw error;
            }
        }
        return null;
    }
    /**
     *  Resolves to the address for %%coinType%% or null if the
     *  provided %%coinType%% has not been configured.
     */
    async getAddress(coinType) {
        if (coinType == null) {
            coinType = 60;
        }
        if (coinType === 60) {
            try {
                const result = await this.#fetch("addr(bytes32)");
                // No address
                if (result == null || result === _constants_index_js__WEBPACK_IMPORTED_MODULE_4__.ZeroAddress) {
                    return null;
                }
                return result;
            }
            catch (error) {
                if ((0,_utils_index_js__WEBPACK_IMPORTED_MODULE_0__.isError)(error, "CALL_EXCEPTION")) {
                    return null;
                }
                throw error;
            }
        }
        let coinPlugin = null;
        for (const plugin of this.provider.plugins) {
            if (!(plugin instanceof MulticoinProviderPlugin)) {
                continue;
            }
            if (plugin.supportsCoinType(coinType)) {
                coinPlugin = plugin;
                break;
            }
        }
        if (coinPlugin == null) {
            return null;
        }
        // keccak256("addr(bytes32,uint256")
        const data = await this.#fetch("addr(bytes32,uint)", [coinType]);
        // No address
        if (data == null || data === "0x") {
            return null;
        }
        // Compute the address
        const address = await coinPlugin.encodeAddress(coinType, data);
        if (address != null) {
            return address;
        }
        (0,_utils_index_js__WEBPACK_IMPORTED_MODULE_0__.assert)(false, `invalid coin data`, "UNSUPPORTED_OPERATION", {
            operation: `getAddress(${coinType})`,
            info: { coinType, data }
        });
    }
    /**
     *  Resovles to the EIP-643 text record for %%key%%, or ``null``
     *  if unconfigured.
     */
    async getText(key) {
        const data = await this.#fetch("text(bytes32,string)", [key]);
        if (data == null || data === "0x") {
            return null;
        }
        return data;
    }
    /**
     *  Rsolves to the content-hash or ``null`` if unconfigured.
     */
    async getContentHash() {
        // keccak256("contenthash()")
        const data = await this.#fetch("contenthash(bytes32)");
        // No contenthash
        if (data == null || data === "0x") {
            return null;
        }
        // IPFS (CID: 1, Type: 70=DAG-PB, 72=libp2p-key)
        const ipfs = data.match(/^0x(e3010170|e5010172)(([0-9a-f][0-9a-f])([0-9a-f][0-9a-f])([0-9a-f]*))$/);
        if (ipfs) {
            const scheme = (ipfs[1] === "e3010170") ? "ipfs" : "ipns";
            const length = parseInt(ipfs[4], 16);
            if (ipfs[5].length === length * 2) {
                return `${scheme}:/\/${(0,_utils_index_js__WEBPACK_IMPORTED_MODULE_5__.encodeBase58)("0x" + ipfs[2])}`;
            }
        }
        // Swarm (CID: 1, Type: swarm-manifest; hash/length hard-coded to keccak256/32)
        const swarm = data.match(/^0xe40101fa011b20([0-9a-f]*)$/);
        if (swarm && swarm[1].length === 64) {
            return `bzz:/\/${swarm[1]}`;
        }
        (0,_utils_index_js__WEBPACK_IMPORTED_MODULE_0__.assert)(false, `invalid or unsupported content hash data`, "UNSUPPORTED_OPERATION", {
            operation: "getContentHash()",
            info: { data }
        });
    }
    /**
     *  Resolves to the avatar url or ``null`` if the avatar is either
     *  unconfigured or incorrectly configured (e.g. references an NFT
     *  not owned by the address).
     *
     *  If diagnosing issues with configurations, the [[_getAvatar]]
     *  method may be useful.
     */
    async getAvatar() {
        const avatar = await this._getAvatar();
        return avatar.url;
    }
    /**
     *  When resolving an avatar, there are many steps involved, such
     *  fetching metadata and possibly validating ownership of an
     *  NFT.
     *
     *  This method can be used to examine each step and the value it
     *  was working from.
     */
    async _getAvatar() {
        const linkage = [{ type: "name", value: this.name }];
        try {
            // test data for ricmoo.eth
            //const avatar = "eip155:1/erc721:0x265385c7f4132228A0d54EB1A9e7460b91c0cC68/29233";
            const avatar = await this.getText("avatar");
            if (avatar == null) {
                linkage.push({ type: "!avatar", value: "" });
                return { url: null, linkage };
            }
            linkage.push({ type: "avatar", value: avatar });
            for (let i = 0; i < matchers.length; i++) {
                const match = avatar.match(matchers[i]);
                if (match == null) {
                    continue;
                }
                const scheme = match[1].toLowerCase();
                switch (scheme) {
                    case "https":
                    case "data":
                        linkage.push({ type: "url", value: avatar });
                        return { linkage, url: avatar };
                    case "ipfs": {
                        const url = getIpfsLink(avatar);
                        linkage.push({ type: "ipfs", value: avatar });
                        linkage.push({ type: "url", value: url });
                        return { linkage, url };
                    }
                    case "erc721":
                    case "erc1155": {
                        // Depending on the ERC type, use tokenURI(uint256) or url(uint256)
                        const selector = (scheme === "erc721") ? "tokenURI(uint256)" : "uri(uint256)";
                        linkage.push({ type: scheme, value: avatar });
                        // The owner of this name
                        const owner = await this.getAddress();
                        if (owner == null) {
                            linkage.push({ type: "!owner", value: "" });
                            return { url: null, linkage };
                        }
                        const comps = (match[2] || "").split("/");
                        if (comps.length !== 2) {
                            linkage.push({ type: `!${scheme}caip`, value: (match[2] || "") });
                            return { url: null, linkage };
                        }
                        const tokenId = comps[1];
                        const contract = new _contract_index_js__WEBPACK_IMPORTED_MODULE_2__.Contract(comps[0], [
                            // ERC-721
                            "function tokenURI(uint) view returns (string)",
                            "function ownerOf(uint) view returns (address)",
                            // ERC-1155
                            "function uri(uint) view returns (string)",
                            "function balanceOf(address, uint256) view returns (uint)"
                        ], this.provider);
                        // Check that this account owns the token
                        if (scheme === "erc721") {
                            const tokenOwner = await contract.ownerOf(tokenId);
                            if (owner !== tokenOwner) {
                                linkage.push({ type: "!owner", value: tokenOwner });
                                return { url: null, linkage };
                            }
                            linkage.push({ type: "owner", value: tokenOwner });
                        }
                        else if (scheme === "erc1155") {
                            const balance = await contract.balanceOf(owner, tokenId);
                            if (!balance) {
                                linkage.push({ type: "!balance", value: "0" });
                                return { url: null, linkage };
                            }
                            linkage.push({ type: "balance", value: balance.toString() });
                        }
                        // Call the token contract for the metadata URL
                        let metadataUrl = await contract[selector](tokenId);
                        if (metadataUrl == null || metadataUrl === "0x") {
                            linkage.push({ type: "!metadata-url", value: "" });
                            return { url: null, linkage };
                        }
                        linkage.push({ type: "metadata-url-base", value: metadataUrl });
                        // ERC-1155 allows a generic {id} in the URL
                        if (scheme === "erc1155") {
                            metadataUrl = metadataUrl.replace("{id}", (0,_utils_index_js__WEBPACK_IMPORTED_MODULE_6__.toBeHex)(tokenId, 32).substring(2));
                            linkage.push({ type: "metadata-url-expanded", value: metadataUrl });
                        }
                        // Transform IPFS metadata links
                        if (metadataUrl.match(/^ipfs:/i)) {
                            metadataUrl = getIpfsLink(metadataUrl);
                        }
                        linkage.push({ type: "metadata-url", value: metadataUrl });
                        // Get the token metadata
                        let metadata = {};
                        const response = await (new _utils_index_js__WEBPACK_IMPORTED_MODULE_7__.FetchRequest(metadataUrl)).send();
                        response.assertOk();
                        try {
                            metadata = response.bodyJson;
                        }
                        catch (error) {
                            try {
                                linkage.push({ type: "!metadata", value: response.bodyText });
                            }
                            catch (error) {
                                const bytes = response.body;
                                if (bytes) {
                                    linkage.push({ type: "!metadata", value: (0,_utils_index_js__WEBPACK_IMPORTED_MODULE_8__.hexlify)(bytes) });
                                }
                                return { url: null, linkage };
                            }
                            return { url: null, linkage };
                        }
                        if (!metadata) {
                            linkage.push({ type: "!metadata", value: "" });
                            return { url: null, linkage };
                        }
                        linkage.push({ type: "metadata", value: JSON.stringify(metadata) });
                        // Pull the image URL out
                        let imageUrl = metadata.image;
                        if (typeof (imageUrl) !== "string") {
                            linkage.push({ type: "!imageUrl", value: "" });
                            return { url: null, linkage };
                        }
                        if (imageUrl.match(/^(https:\/\/|data:)/i)) {
                            // Allow
                        }
                        else {
                            // Transform IPFS link to gateway
                            const ipfs = imageUrl.match(matcherIpfs);
                            if (ipfs == null) {
                                linkage.push({ type: "!imageUrl-ipfs", value: imageUrl });
                                return { url: null, linkage };
                            }
                            linkage.push({ type: "imageUrl-ipfs", value: imageUrl });
                            imageUrl = getIpfsLink(imageUrl);
                        }
                        linkage.push({ type: "url", value: imageUrl });
                        return { linkage, url: imageUrl };
                    }
                }
            }
        }
        catch (error) { }
        return { linkage, url: null };
    }
    static async getEnsAddress(provider) {
        const network = await provider.getNetwork();
        const ensPlugin = network.getPlugin("org.ethers.plugins.network.Ens");
        // No ENS...
        (0,_utils_index_js__WEBPACK_IMPORTED_MODULE_0__.assert)(ensPlugin, "network does not support ENS", "UNSUPPORTED_OPERATION", {
            operation: "getEnsAddress", info: { network }
        });
        return ensPlugin.address;
    }
    static async #getResolver(provider, name) {
        const ensAddr = await EnsResolver.getEnsAddress(provider);
        try {
            const contract = new _contract_index_js__WEBPACK_IMPORTED_MODULE_2__.Contract(ensAddr, [
                "function resolver(bytes32) view returns (address)"
            ], provider);
            const addr = await contract.resolver((0,_hash_index_js__WEBPACK_IMPORTED_MODULE_3__.namehash)(name), {
                enableCcipRead: true
            });
            if (addr === _constants_index_js__WEBPACK_IMPORTED_MODULE_4__.ZeroAddress) {
                return null;
            }
            return addr;
        }
        catch (error) {
            // ENS registry cannot throw errors on resolver(bytes32),
            // so probably a link error
            throw error;
        }
        return null;
    }
    /**
     *  Resolve to the ENS resolver for %%name%% using %%provider%% or
     *  ``null`` if unconfigured.
     */
    static async fromName(provider, name) {
        let currentName = name;
        while (true) {
            if (currentName === "" || currentName === ".") {
                return null;
            }
            // Optimization since the eth node cannot change and does
            // not have a wildcar resolver
            if (name !== "eth" && currentName === "eth") {
                return null;
            }
            // Check the current node for a resolver
            const addr = await EnsResolver.#getResolver(provider, currentName);
            // Found a resolver!
            if (addr != null) {
                const resolver = new EnsResolver(provider, addr, name);
                // Legacy resolver found, using EIP-2544 so it isn't safe to use
                if (currentName !== name && !(await resolver.supportsWildcard())) {
                    return null;
                }
                return resolver;
            }
            // Get the parent node
            currentName = currentName.split(".").slice(1).join(".");
        }
    }
}
//# sourceMappingURL=ens-resolver.js.map

/***/ }),

/***/ "./node_modules/ethers/lib.esm/providers/format.js":
/*!*********************************************************!*\
  !*** ./node_modules/ethers/lib.esm/providers/format.js ***!
  \*********************************************************/
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "allowNull": () => (/* binding */ allowNull),
/* harmony export */   "arrayOf": () => (/* binding */ arrayOf),
/* harmony export */   "formatBlock": () => (/* binding */ formatBlock),
/* harmony export */   "formatBoolean": () => (/* binding */ formatBoolean),
/* harmony export */   "formatData": () => (/* binding */ formatData),
/* harmony export */   "formatHash": () => (/* binding */ formatHash),
/* harmony export */   "formatLog": () => (/* binding */ formatLog),
/* harmony export */   "formatReceiptLog": () => (/* binding */ formatReceiptLog),
/* harmony export */   "formatTransactionReceipt": () => (/* binding */ formatTransactionReceipt),
/* harmony export */   "formatTransactionResponse": () => (/* binding */ formatTransactionResponse),
/* harmony export */   "formatUint256": () => (/* binding */ formatUint256),
/* harmony export */   "object": () => (/* binding */ object)
/* harmony export */ });
/* harmony import */ var _address_index_js__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ../address/index.js */ "./node_modules/ethers/lib.esm/address/address.js");
/* harmony import */ var _address_index_js__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! ../address/index.js */ "./node_modules/ethers/lib.esm/address/contract-address.js");
/* harmony import */ var _crypto_index_js__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! ../crypto/index.js */ "./node_modules/ethers/lib.esm/crypto/signature.js");
/* harmony import */ var _transaction_index_js__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ../transaction/index.js */ "./node_modules/ethers/lib.esm/transaction/accesslist.js");
/* harmony import */ var _utils_index_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../utils/index.js */ "./node_modules/ethers/lib.esm/utils/errors.js");
/* harmony import */ var _utils_index_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../utils/index.js */ "./node_modules/ethers/lib.esm/utils/data.js");
/* harmony import */ var _utils_index_js__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ../utils/index.js */ "./node_modules/ethers/lib.esm/utils/maths.js");
/**
 *  @_ignore
 */




const BN_0 = BigInt(0);
function allowNull(format, nullValue) {
    return (function (value) {
        if (value == null) {
            return nullValue;
        }
        return format(value);
    });
}
function arrayOf(format) {
    return ((array) => {
        if (!Array.isArray(array)) {
            throw new Error("not an array");
        }
        return array.map((i) => format(i));
    });
}
// Requires an object which matches a fleet of other formatters
// Any FormatFunc may return `undefined` to have the value omitted
// from the result object. Calls preserve `this`.
function object(format, altNames) {
    return ((value) => {
        const result = {};
        for (const key in format) {
            let srcKey = key;
            if (altNames && key in altNames && !(srcKey in value)) {
                for (const altKey of altNames[key]) {
                    if (altKey in value) {
                        srcKey = altKey;
                        break;
                    }
                }
            }
            try {
                const nv = format[key](value[srcKey]);
                if (nv !== undefined) {
                    result[key] = nv;
                }
            }
            catch (error) {
                const message = (error instanceof Error) ? error.message : "not-an-error";
                (0,_utils_index_js__WEBPACK_IMPORTED_MODULE_0__.assert)(false, `invalid value for value.${key} (${message})`, "BAD_DATA", { value });
            }
        }
        return result;
    });
}
function formatBoolean(value) {
    switch (value) {
        case true:
        case "true":
            return true;
        case false:
        case "false":
            return false;
    }
    (0,_utils_index_js__WEBPACK_IMPORTED_MODULE_0__.assertArgument)(false, `invalid boolean; ${JSON.stringify(value)}`, "value", value);
}
function formatData(value) {
    (0,_utils_index_js__WEBPACK_IMPORTED_MODULE_0__.assertArgument)((0,_utils_index_js__WEBPACK_IMPORTED_MODULE_1__.isHexString)(value, true), "invalid data", "value", value);
    return value;
}
function formatHash(value) {
    (0,_utils_index_js__WEBPACK_IMPORTED_MODULE_0__.assertArgument)((0,_utils_index_js__WEBPACK_IMPORTED_MODULE_1__.isHexString)(value, 32), "invalid hash", "value", value);
    return value;
}
function formatUint256(value) {
    if (!(0,_utils_index_js__WEBPACK_IMPORTED_MODULE_1__.isHexString)(value)) {
        throw new Error("invalid uint256");
    }
    return (0,_utils_index_js__WEBPACK_IMPORTED_MODULE_1__.zeroPadValue)(value, 32);
}
const _formatLog = object({
    address: _address_index_js__WEBPACK_IMPORTED_MODULE_2__.getAddress,
    blockHash: formatHash,
    blockNumber: _utils_index_js__WEBPACK_IMPORTED_MODULE_3__.getNumber,
    data: formatData,
    index: _utils_index_js__WEBPACK_IMPORTED_MODULE_3__.getNumber,
    removed: formatBoolean,
    topics: arrayOf(formatHash),
    transactionHash: formatHash,
    transactionIndex: _utils_index_js__WEBPACK_IMPORTED_MODULE_3__.getNumber,
}, {
    index: ["logIndex"]
});
function formatLog(value) {
    return _formatLog(value);
}
const _formatBlock = object({
    hash: allowNull(formatHash),
    parentHash: formatHash,
    number: _utils_index_js__WEBPACK_IMPORTED_MODULE_3__.getNumber,
    timestamp: _utils_index_js__WEBPACK_IMPORTED_MODULE_3__.getNumber,
    nonce: allowNull(formatData),
    difficulty: _utils_index_js__WEBPACK_IMPORTED_MODULE_3__.getBigInt,
    gasLimit: _utils_index_js__WEBPACK_IMPORTED_MODULE_3__.getBigInt,
    gasUsed: _utils_index_js__WEBPACK_IMPORTED_MODULE_3__.getBigInt,
    miner: allowNull(_address_index_js__WEBPACK_IMPORTED_MODULE_2__.getAddress),
    extraData: formatData,
    baseFeePerGas: allowNull(_utils_index_js__WEBPACK_IMPORTED_MODULE_3__.getBigInt)
});
function formatBlock(value) {
    const result = _formatBlock(value);
    result.transactions = value.transactions.map((tx) => {
        if (typeof (tx) === "string") {
            return tx;
        }
        return formatTransactionResponse(tx);
    });
    return result;
}
const _formatReceiptLog = object({
    transactionIndex: _utils_index_js__WEBPACK_IMPORTED_MODULE_3__.getNumber,
    blockNumber: _utils_index_js__WEBPACK_IMPORTED_MODULE_3__.getNumber,
    transactionHash: formatHash,
    address: _address_index_js__WEBPACK_IMPORTED_MODULE_2__.getAddress,
    topics: arrayOf(formatHash),
    data: formatData,
    index: _utils_index_js__WEBPACK_IMPORTED_MODULE_3__.getNumber,
    blockHash: formatHash,
}, {
    index: ["logIndex"]
});
function formatReceiptLog(value) {
    return _formatReceiptLog(value);
}
const _formatTransactionReceipt = object({
    to: allowNull(_address_index_js__WEBPACK_IMPORTED_MODULE_2__.getAddress, null),
    from: allowNull(_address_index_js__WEBPACK_IMPORTED_MODULE_2__.getAddress, null),
    contractAddress: allowNull(_address_index_js__WEBPACK_IMPORTED_MODULE_2__.getAddress, null),
    // should be allowNull(hash), but broken-EIP-658 support is handled in receipt
    index: _utils_index_js__WEBPACK_IMPORTED_MODULE_3__.getNumber,
    root: allowNull(_utils_index_js__WEBPACK_IMPORTED_MODULE_1__.hexlify),
    gasUsed: _utils_index_js__WEBPACK_IMPORTED_MODULE_3__.getBigInt,
    logsBloom: allowNull(formatData),
    blockHash: formatHash,
    hash: formatHash,
    logs: arrayOf(formatReceiptLog),
    blockNumber: _utils_index_js__WEBPACK_IMPORTED_MODULE_3__.getNumber,
    //confirmations: allowNull(getNumber, null),
    cumulativeGasUsed: _utils_index_js__WEBPACK_IMPORTED_MODULE_3__.getBigInt,
    effectiveGasPrice: allowNull(_utils_index_js__WEBPACK_IMPORTED_MODULE_3__.getBigInt),
    status: allowNull(_utils_index_js__WEBPACK_IMPORTED_MODULE_3__.getNumber),
    type: allowNull(_utils_index_js__WEBPACK_IMPORTED_MODULE_3__.getNumber, 0)
}, {
    effectiveGasPrice: ["gasPrice"],
    hash: ["transactionHash"],
    index: ["transactionIndex"],
});
function formatTransactionReceipt(value) {
    return _formatTransactionReceipt(value);
}
function formatTransactionResponse(value) {
    // Some clients (TestRPC) do strange things like return 0x0 for the
    // 0 address; correct this to be a real address
    if (value.to && (0,_utils_index_js__WEBPACK_IMPORTED_MODULE_3__.getBigInt)(value.to) === BN_0) {
        value.to = "0x0000000000000000000000000000000000000000";
    }
    const result = object({
        hash: formatHash,
        type: (value) => {
            if (value === "0x" || value == null) {
                return 0;
            }
            return (0,_utils_index_js__WEBPACK_IMPORTED_MODULE_3__.getNumber)(value);
        },
        accessList: allowNull(_transaction_index_js__WEBPACK_IMPORTED_MODULE_4__.accessListify, null),
        blockHash: allowNull(formatHash, null),
        blockNumber: allowNull(_utils_index_js__WEBPACK_IMPORTED_MODULE_3__.getNumber, null),
        transactionIndex: allowNull(_utils_index_js__WEBPACK_IMPORTED_MODULE_3__.getNumber, null),
        //confirmations: allowNull(getNumber, null),
        from: _address_index_js__WEBPACK_IMPORTED_MODULE_2__.getAddress,
        // either (gasPrice) or (maxPriorityFeePerGas + maxFeePerGas) must be set
        gasPrice: allowNull(_utils_index_js__WEBPACK_IMPORTED_MODULE_3__.getBigInt),
        maxPriorityFeePerGas: allowNull(_utils_index_js__WEBPACK_IMPORTED_MODULE_3__.getBigInt),
        maxFeePerGas: allowNull(_utils_index_js__WEBPACK_IMPORTED_MODULE_3__.getBigInt),
        gasLimit: _utils_index_js__WEBPACK_IMPORTED_MODULE_3__.getBigInt,
        to: allowNull(_address_index_js__WEBPACK_IMPORTED_MODULE_2__.getAddress, null),
        value: _utils_index_js__WEBPACK_IMPORTED_MODULE_3__.getBigInt,
        nonce: _utils_index_js__WEBPACK_IMPORTED_MODULE_3__.getNumber,
        data: formatData,
        creates: allowNull(_address_index_js__WEBPACK_IMPORTED_MODULE_2__.getAddress, null),
        chainId: allowNull(_utils_index_js__WEBPACK_IMPORTED_MODULE_3__.getBigInt, null)
    }, {
        data: ["input"],
        gasLimit: ["gas"]
    })(value);
    // If to and creates are empty, populate the creates from the value
    if (result.to == null && result.creates == null) {
        result.creates = (0,_address_index_js__WEBPACK_IMPORTED_MODULE_5__.getCreateAddress)(result);
    }
    // @TODO: Check fee data
    // Add an access list to supported transaction types
    if ((value.type === 1 || value.type === 2) && value.accessList == null) {
        result.accessList = [];
    }
    // Compute the signature
    if (value.signature) {
        result.signature = _crypto_index_js__WEBPACK_IMPORTED_MODULE_6__.Signature.from(value.signature);
    }
    else {
        result.signature = _crypto_index_js__WEBPACK_IMPORTED_MODULE_6__.Signature.from(value);
    }
    // Some backends omit ChainId on legacy transactions, but we can compute it
    if (result.chainId == null) {
        const chainId = result.signature.legacyChainId;
        if (chainId != null) {
            result.chainId = chainId;
        }
    }
    // @TODO: check chainID
    /*
    if (value.chainId != null) {
        let chainId = value.chainId;

        if (isHexString(chainId)) {
            chainId = BigNumber.from(chainId).toNumber();
        }

        result.chainId = chainId;

    } else {
        let chainId = value.networkId;

        // geth-etc returns chainId
        if (chainId == null && result.v == null) {
            chainId = value.chainId;
        }

        if (isHexString(chainId)) {
            chainId = BigNumber.from(chainId).toNumber();
        }

        if (typeof(chainId) !== "number" && result.v != null) {
            chainId = (result.v - 35) / 2;
            if (chainId < 0) { chainId = 0; }
            chainId = parseInt(chainId);
        }

        if (typeof(chainId) !== "number") { chainId = 0; }

        result.chainId = chainId;
    }
    */
    // 0x0000... should actually be null
    if (result.blockHash && (0,_utils_index_js__WEBPACK_IMPORTED_MODULE_3__.getBigInt)(result.blockHash) === BN_0) {
        result.blockHash = null;
    }
    return result;
}
//# sourceMappingURL=format.js.map

/***/ }),

/***/ "./node_modules/ethers/lib.esm/providers/network.js":
/*!**********************************************************!*\
  !*** ./node_modules/ethers/lib.esm/providers/network.js ***!
  \**********************************************************/
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "Network": () => (/* binding */ Network)
/* harmony export */ });
/* harmony import */ var _transaction_index_js__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ../transaction/index.js */ "./node_modules/ethers/lib.esm/transaction/accesslist.js");
/* harmony import */ var _utils_index_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../utils/index.js */ "./node_modules/ethers/lib.esm/utils/maths.js");
/* harmony import */ var _utils_index_js__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ../utils/index.js */ "./node_modules/ethers/lib.esm/utils/errors.js");
/* harmony import */ var _plugins_network_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./plugins-network.js */ "./node_modules/ethers/lib.esm/providers/plugins-network.js");
/**
 *  About networks
 *
 *  @_subsection: api/providers:Networks  [networks]
 */



/* * * *
// Networks which operation against an L2 can use this plugin to
// specify how to access L1, for the purpose of resolving ENS,
// for example.
export class LayerOneConnectionPlugin extends NetworkPlugin {
    readonly provider!: Provider;
// @TODO: Rename to ChainAccess and allow for connecting to any chain
    constructor(provider: Provider) {
        super("org.ethers.plugins.layer-one-connection");
        defineProperties<LayerOneConnectionPlugin>(this, { provider });
    }

    clone(): LayerOneConnectionPlugin {
        return new LayerOneConnectionPlugin(this.provider);
    }
}
*/
/* * * *
export class PriceOraclePlugin extends NetworkPlugin {
    readonly address!: string;

    constructor(address: string) {
        super("org.ethers.plugins.price-oracle");
        defineProperties<PriceOraclePlugin>(this, { address });
    }

    clone(): PriceOraclePlugin {
        return new PriceOraclePlugin(this.address);
    }
}
*/
// Networks or clients with a higher need for security (such as clients
// that may automatically make CCIP requests without user interaction)
// can use this plugin to anonymize requests or intercept CCIP requests
// to notify and/or receive authorization from the user
/* * * *
export type FetchDataFunc = (req: Frozen<FetchRequest>) => Promise<FetchRequest>;
export class CcipPreflightPlugin extends NetworkPlugin {
    readonly fetchData!: FetchDataFunc;

    constructor(fetchData: FetchDataFunc) {
        super("org.ethers.plugins.ccip-preflight");
        defineProperties<CcipPreflightPlugin>(this, { fetchData });
    }

    clone(): CcipPreflightPlugin {
        return new CcipPreflightPlugin(this.fetchData);
    }
}
*/
const Networks = new Map();
// @TODO: Add a _ethersNetworkObj variable to better detect network ovjects
class Network {
    #name;
    #chainId;
    #plugins;
    constructor(name, chainId) {
        this.#name = name;
        this.#chainId = (0,_utils_index_js__WEBPACK_IMPORTED_MODULE_0__.getBigInt)(chainId);
        this.#plugins = new Map();
    }
    toJSON() {
        return { name: this.name, chainId: this.chainId };
    }
    get name() { return this.#name; }
    set name(value) { this.#name = value; }
    get chainId() { return this.#chainId; }
    set chainId(value) { this.#chainId = (0,_utils_index_js__WEBPACK_IMPORTED_MODULE_0__.getBigInt)(value, "chainId"); }
    get plugins() {
        return Array.from(this.#plugins.values());
    }
    attachPlugin(plugin) {
        if (this.#plugins.get(plugin.name)) {
            throw new Error(`cannot replace existing plugin: ${plugin.name} `);
        }
        this.#plugins.set(plugin.name, plugin.clone());
        return this;
    }
    getPlugin(name) {
        return (this.#plugins.get(name)) || null;
    }
    // Gets a list of Plugins which match basename, ignoring any fragment
    getPlugins(basename) {
        return (this.plugins.filter((p) => (p.name.split("#")[0] === basename)));
    }
    clone() {
        const clone = new Network(this.name, this.chainId);
        this.plugins.forEach((plugin) => {
            clone.attachPlugin(plugin.clone());
        });
        return clone;
    }
    computeIntrinsicGas(tx) {
        const costs = this.getPlugin("org.ethers.plugins.network.GasCost") || (new _plugins_network_js__WEBPACK_IMPORTED_MODULE_1__.GasCostPlugin());
        let gas = costs.txBase;
        if (tx.to == null) {
            gas += costs.txCreate;
        }
        if (tx.data) {
            for (let i = 2; i < tx.data.length; i += 2) {
                if (tx.data.substring(i, i + 2) === "00") {
                    gas += costs.txDataZero;
                }
                else {
                    gas += costs.txDataNonzero;
                }
            }
        }
        if (tx.accessList) {
            const accessList = (0,_transaction_index_js__WEBPACK_IMPORTED_MODULE_2__.accessListify)(tx.accessList);
            for (const addr in accessList) {
                gas += costs.txAccessListAddress + costs.txAccessListStorageKey * accessList[addr].storageKeys.length;
            }
        }
        return gas;
    }
    /**
     *  Returns a new Network for the %%network%% name or chainId.
     */
    static from(network) {
        injectCommonNetworks();
        // Default network
        if (network == null) {
            return Network.from("mainnet");
        }
        // Canonical name or chain ID
        if (typeof (network) === "number") {
            network = BigInt(network);
        }
        if (typeof (network) === "string" || typeof (network) === "bigint") {
            const networkFunc = Networks.get(network);
            if (networkFunc) {
                return networkFunc();
            }
            if (typeof (network) === "bigint") {
                return new Network("unknown", network);
            }
            (0,_utils_index_js__WEBPACK_IMPORTED_MODULE_3__.assertArgument)(false, "unknown network", "network", network);
        }
        // Clonable with network-like abilities
        if (typeof (network.clone) === "function") {
            const clone = network.clone();
            //if (typeof(network.name) !== "string" || typeof(network.chainId) !== "number") {
            //}
            return clone;
        }
        // Networkish
        if (typeof (network) === "object") {
            (0,_utils_index_js__WEBPACK_IMPORTED_MODULE_3__.assertArgument)(typeof (network.name) === "string" && typeof (network.chainId) === "number", "invalid network object name or chainId", "network", network);
            const custom = new Network((network.name), (network.chainId));
            if (network.ensAddress || network.ensNetwork != null) {
                custom.attachPlugin(new _plugins_network_js__WEBPACK_IMPORTED_MODULE_1__.EnsPlugin(network.ensAddress, network.ensNetwork));
            }
            //if ((<any>network).layerOneConnection) {
            //    custom.attachPlugin(new LayerOneConnectionPlugin((<any>network).layerOneConnection));
            //}
            return custom;
        }
        (0,_utils_index_js__WEBPACK_IMPORTED_MODULE_3__.assertArgument)(false, "invalid network", "network", network);
    }
    /**
     *  Register %%nameOrChainId%% with a function which returns
     *  an instance of a Network representing that chain.
     */
    static register(nameOrChainId, networkFunc) {
        if (typeof (nameOrChainId) === "number") {
            nameOrChainId = BigInt(nameOrChainId);
        }
        const existing = Networks.get(nameOrChainId);
        if (existing) {
            (0,_utils_index_js__WEBPACK_IMPORTED_MODULE_3__.assertArgument)(false, `conflicting network for ${JSON.stringify(existing.name)}`, "nameOrChainId", nameOrChainId);
        }
        Networks.set(nameOrChainId, networkFunc);
    }
}
// See: https://chainlist.org
let injected = false;
function injectCommonNetworks() {
    if (injected) {
        return;
    }
    injected = true;
    /// Register popular Ethereum networks
    function registerEth(name, chainId, options) {
        const func = function () {
            const network = new Network(name, chainId);
            // We use 0 to disable ENS
            if (options.ensNetwork != null) {
                network.attachPlugin(new _plugins_network_js__WEBPACK_IMPORTED_MODULE_1__.EnsPlugin(null, options.ensNetwork));
            }
            if (options.priorityFee) {
                //                network.attachPlugin(new MaxPriorityFeePlugin(options.priorityFee));
            }
            /*
                        if (options.etherscan) {
                            const { url, apiKey } = options.etherscan;
                            network.attachPlugin(new EtherscanPlugin(url, apiKey));
                        }
            */
            network.attachPlugin(new _plugins_network_js__WEBPACK_IMPORTED_MODULE_1__.GasCostPlugin());
            return network;
        };
        // Register the network by name and chain ID
        Network.register(name, func);
        Network.register(chainId, func);
        if (options.altNames) {
            options.altNames.forEach((name) => {
                Network.register(name, func);
            });
        }
    }
    registerEth("mainnet", 1, { ensNetwork: 1, altNames: ["homestead"] });
    registerEth("ropsten", 3, { ensNetwork: 3 });
    registerEth("rinkeby", 4, { ensNetwork: 4 });
    registerEth("goerli", 5, { ensNetwork: 5 });
    registerEth("kovan", 42, { ensNetwork: 42 });
    registerEth("classic", 61, {});
    registerEth("classicKotti", 6, {});
    registerEth("xdai", 100, { ensNetwork: 1 });
    registerEth("optimism", 10, {
        ensNetwork: 1,
        etherscan: { url: "https:/\/api-optimistic.etherscan.io/" }
    });
    registerEth("optimism-goerli", 420, {
        etherscan: { url: "https:/\/api-goerli-optimistic.etherscan.io/" }
    });
    registerEth("arbitrum", 42161, {
        ensNetwork: 1,
        etherscan: { url: "https:/\/api.arbiscan.io/" }
    });
    registerEth("arbitrum-goerli", 421613, {
        etherscan: { url: "https:/\/api-goerli.arbiscan.io/" }
    });
    // Polygon has a 35 gwei maxPriorityFee requirement
    registerEth("matic", 137, {
        ensNetwork: 1,
        //        priorityFee: 35000000000,
        etherscan: {
            //            apiKey: "W6T8DJW654GNTQ34EFEYYP3EZD9DD27CT7",
            url: "https:/\/api.polygonscan.com/"
        }
    });
    registerEth("matic-mumbai", 80001, {
        altNames: ["maticMumbai", "maticmum"],
        //        priorityFee: 35000000000,
        etherscan: {
            //            apiKey: "W6T8DJW654GNTQ34EFEYYP3EZD9DD27CT7",
            url: "https:/\/api-testnet.polygonscan.com/"
        }
    });
    registerEth("bnb", 56, {
        ensNetwork: 1,
        etherscan: {
            //            apiKey: "EVTS3CU31AATZV72YQ55TPGXGMVIFUQ9M9",
            url: "http:/\/api.bscscan.com"
        }
    });
    registerEth("bnbt", 97, {
        etherscan: {
            //            apiKey: "EVTS3CU31AATZV72YQ55TPGXGMVIFUQ9M9",
            url: "http:/\/api-testnet.bscscan.com"
        }
    });
}
//# sourceMappingURL=network.js.map

/***/ }),

/***/ "./node_modules/ethers/lib.esm/providers/plugins-network.js":
/*!******************************************************************!*\
  !*** ./node_modules/ethers/lib.esm/providers/plugins-network.js ***!
  \******************************************************************/
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "EnsPlugin": () => (/* binding */ EnsPlugin),
/* harmony export */   "FeeDataNetworkPlugin": () => (/* binding */ FeeDataNetworkPlugin),
/* harmony export */   "GasCostPlugin": () => (/* binding */ GasCostPlugin),
/* harmony export */   "NetworkPlugin": () => (/* binding */ NetworkPlugin)
/* harmony export */ });
/* harmony import */ var _utils_properties_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../utils/properties.js */ "./node_modules/ethers/lib.esm/utils/properties.js");
/* harmony import */ var _utils_index_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../utils/index.js */ "./node_modules/ethers/lib.esm/utils/errors.js");


const EnsAddress = "0x00000000000C2E074eC69A0dFb2997BA6C7d2e1e";
class NetworkPlugin {
    name;
    constructor(name) {
        (0,_utils_properties_js__WEBPACK_IMPORTED_MODULE_0__.defineProperties)(this, { name });
    }
    clone() {
        return new NetworkPlugin(this.name);
    }
}
class GasCostPlugin extends NetworkPlugin {
    effectiveBlock;
    txBase;
    txCreate;
    txDataZero;
    txDataNonzero;
    txAccessListStorageKey;
    txAccessListAddress;
    constructor(effectiveBlock, costs) {
        if (effectiveBlock == null) {
            effectiveBlock = 0;
        }
        super(`org.ethers.network.plugins.GasCost#${(effectiveBlock || 0)}`);
        const props = { effectiveBlock };
        function set(name, nullish) {
            let value = (costs || {})[name];
            if (value == null) {
                value = nullish;
            }
            (0,_utils_index_js__WEBPACK_IMPORTED_MODULE_1__.assertArgument)(typeof (value) === "number", `invalud value for ${name}`, "costs", costs);
            props[name] = value;
        }
        set("txBase", 21000);
        set("txCreate", 32000);
        set("txDataZero", 4);
        set("txDataNonzero", 16);
        set("txAccessListStorageKey", 1900);
        set("txAccessListAddress", 2400);
        (0,_utils_properties_js__WEBPACK_IMPORTED_MODULE_0__.defineProperties)(this, props);
    }
    clone() {
        return new GasCostPlugin(this.effectiveBlock, this);
    }
}
// Networks shoudl use this plugin to specify the contract address
// and network necessary to resolve ENS names.
class EnsPlugin extends NetworkPlugin {
    // The ENS contract address
    address;
    // The network ID that the ENS contract lives on
    targetNetwork;
    constructor(address, targetNetwork) {
        super("org.ethers.plugins.network.Ens");
        (0,_utils_properties_js__WEBPACK_IMPORTED_MODULE_0__.defineProperties)(this, {
            address: (address || EnsAddress),
            targetNetwork: ((targetNetwork == null) ? 1 : targetNetwork)
        });
    }
    clone() {
        return new EnsPlugin(this.address, this.targetNetwork);
    }
}
class FeeDataNetworkPlugin extends NetworkPlugin {
    #feeDataFunc;
    get feeDataFunc() {
        return this.#feeDataFunc;
    }
    constructor(feeDataFunc) {
        super("org.ethers.plugins.network.FeeData");
        this.#feeDataFunc = feeDataFunc;
    }
    async getFeeData(provider) {
        return await this.#feeDataFunc(provider);
    }
    clone() {
        return new FeeDataNetworkPlugin(this.#feeDataFunc);
    }
}
/*
export class CustomBlockNetworkPlugin extends NetworkPlugin {
    readonly #blockFunc: (provider: Provider, block: BlockParams<string>) => Block<string>;
    readonly #blockWithTxsFunc: (provider: Provider, block: BlockParams<TransactionResponseParams>) => Block<TransactionResponse>;

    constructor(blockFunc: (provider: Provider, block: BlockParams<string>) => Block<string>, blockWithTxsFunc: (provider: Provider, block: BlockParams<TransactionResponseParams>) => Block<TransactionResponse>) {
        super("org.ethers.network-plugins.custom-block");
        this.#blockFunc = blockFunc;
        this.#blockWithTxsFunc = blockWithTxsFunc;
    }

    async getBlock(provider: Provider, block: BlockParams<string>): Promise<Block<string>> {
        return await this.#blockFunc(provider, block);
    }

    async getBlockions(provider: Provider, block: BlockParams<TransactionResponseParams>): Promise<Block<TransactionResponse>> {
        return await this.#blockWithTxsFunc(provider, block);
    }

    clone(): CustomBlockNetworkPlugin {
        return new CustomBlockNetworkPlugin(this.#blockFunc, this.#blockWithTxsFunc);
    }
}
*/
//# sourceMappingURL=plugins-network.js.map

/***/ }),

/***/ "./node_modules/ethers/lib.esm/providers/provider-alchemy.js":
/*!*******************************************************************!*\
  !*** ./node_modules/ethers/lib.esm/providers/provider-alchemy.js ***!
  \*******************************************************************/
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "AlchemyProvider": () => (/* binding */ AlchemyProvider)
/* harmony export */ });
/* harmony import */ var _utils_index_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../utils/index.js */ "./node_modules/ethers/lib.esm/utils/errors.js");
/* harmony import */ var _utils_index_js__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ../utils/index.js */ "./node_modules/ethers/lib.esm/utils/properties.js");
/* harmony import */ var _utils_index_js__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ../utils/index.js */ "./node_modules/ethers/lib.esm/utils/fetch.js");
/* harmony import */ var _community_js__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! ./community.js */ "./node_modules/ethers/lib.esm/providers/community.js");
/* harmony import */ var _network_js__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./network.js */ "./node_modules/ethers/lib.esm/providers/network.js");
/* harmony import */ var _provider_jsonrpc_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./provider-jsonrpc.js */ "./node_modules/ethers/lib.esm/providers/provider-jsonrpc.js");
/**
 *  About Alchemy
 *
 *  @_subsection: api/providers/thirdparty:Alchemy  [providers-alchemy]
 */




const defaultApiKey = "_gg7wSSi0KMBsdKnGVfHDueq6xMB9EkC";
function getHost(name) {
    switch (name) {
        case "mainnet":
            return "eth-mainnet.alchemyapi.io";
        case "goerli":
            return "eth-goerli.g.alchemy.com";
        case "arbitrum":
            return "arb-mainnet.g.alchemy.com";
        case "arbitrum-goerli":
            return "arb-goerli.g.alchemy.com";
        case "matic":
            return "polygon-mainnet.g.alchemy.com";
        case "matic-mumbai":
            return "polygon-mumbai.g.alchemy.com";
        case "optimism":
            return "opt-mainnet.g.alchemy.com";
        case "optimism-goerli":
            return "opt-goerli.g.alchemy.com";
    }
    (0,_utils_index_js__WEBPACK_IMPORTED_MODULE_0__.assertArgument)(false, "unsupported network", "network", name);
}
/**
 *  The **AlchemyProvider** connects to the [[link-alchemy]]
 *  JSON-RPC end-points.
 *
 *  By default, a highly-throttled API key is used, which is
 *  appropriate for quick prototypes and simple scripts. To
 *  gain access to an increased rate-limit, it is highly
 *  recommended to [sign up here](link-alchemy-signup).
 *
 *  @_docloc: api/providers/thirdparty
 */
class AlchemyProvider extends _provider_jsonrpc_js__WEBPACK_IMPORTED_MODULE_1__.JsonRpcProvider {
    apiKey;
    constructor(_network, apiKey) {
        if (_network == null) {
            _network = "mainnet";
        }
        const network = _network_js__WEBPACK_IMPORTED_MODULE_2__.Network.from(_network);
        if (apiKey == null) {
            apiKey = defaultApiKey;
        }
        const request = AlchemyProvider.getRequest(network, apiKey);
        super(request, network, { staticNetwork: network });
        (0,_utils_index_js__WEBPACK_IMPORTED_MODULE_3__.defineProperties)(this, { apiKey });
    }
    _getProvider(chainId) {
        try {
            return new AlchemyProvider(chainId, this.apiKey);
        }
        catch (error) { }
        return super._getProvider(chainId);
    }
    async _perform(req) {
        // https://docs.alchemy.com/reference/trace-transaction
        if (req.method === "getTransactionResult") {
            const { trace, tx } = await (0,_utils_index_js__WEBPACK_IMPORTED_MODULE_3__.resolveProperties)({
                trace: this.send("trace_transaction", [req.hash]),
                tx: this.getTransaction(req.hash)
            });
            if (trace == null || tx == null) {
                return null;
            }
            let data;
            let error = false;
            try {
                data = trace[0].result.output;
                error = (trace[0].error === "Reverted");
            }
            catch (error) { }
            if (data) {
                (0,_utils_index_js__WEBPACK_IMPORTED_MODULE_0__.assert)(!error, "an error occurred during transaction executions", "CALL_EXCEPTION", {
                    action: "getTransactionResult",
                    data,
                    reason: null,
                    transaction: tx,
                    invocation: null,
                    revert: null // @TODO
                });
                return data;
            }
            (0,_utils_index_js__WEBPACK_IMPORTED_MODULE_0__.assert)(false, "could not parse trace result", "BAD_DATA", { value: trace });
        }
        return await super._perform(req);
    }
    isCommunityResource() {
        return (this.apiKey === defaultApiKey);
    }
    static getRequest(network, apiKey) {
        if (apiKey == null) {
            apiKey = defaultApiKey;
        }
        const request = new _utils_index_js__WEBPACK_IMPORTED_MODULE_4__.FetchRequest(`https:/\/${getHost(network.name)}/v2/${apiKey}`);
        request.allowGzip = true;
        if (apiKey === defaultApiKey) {
            request.retryFunc = async (request, response, attempt) => {
                (0,_community_js__WEBPACK_IMPORTED_MODULE_5__.showThrottleMessage)("alchemy");
                return true;
            };
        }
        return request;
    }
}
//# sourceMappingURL=provider-alchemy.js.map

/***/ }),

/***/ "./node_modules/ethers/lib.esm/providers/provider-ankr.js":
/*!****************************************************************!*\
  !*** ./node_modules/ethers/lib.esm/providers/provider-ankr.js ***!
  \****************************************************************/
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "AnkrProvider": () => (/* binding */ AnkrProvider)
/* harmony export */ });
/* harmony import */ var _utils_index_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../utils/index.js */ "./node_modules/ethers/lib.esm/utils/errors.js");
/* harmony import */ var _utils_index_js__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ../utils/index.js */ "./node_modules/ethers/lib.esm/utils/properties.js");
/* harmony import */ var _utils_index_js__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ../utils/index.js */ "./node_modules/ethers/lib.esm/utils/fetch.js");
/* harmony import */ var _community_js__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! ./community.js */ "./node_modules/ethers/lib.esm/providers/community.js");
/* harmony import */ var _network_js__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./network.js */ "./node_modules/ethers/lib.esm/providers/network.js");
/* harmony import */ var _provider_jsonrpc_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./provider-jsonrpc.js */ "./node_modules/ethers/lib.esm/providers/provider-jsonrpc.js");
/**
 *  [[link-ankr]] provides a third-party service for connecting to
 *  various blockchains over JSON-RPC.
 *
 *  **Supported Networks**
 *
 *  - Ethereum Mainnet (``mainnet``)
 *  - Goerli Testnet (``goerli``)
 *  - Polygon (``matic``)
 *  - Arbitrum (``arbitrum``)
 *
 *  @_subsection: api/providers/thirdparty:Ankr  [providers-ankr]
 */




const defaultApiKey = "9f7d929b018cdffb338517efa06f58359e86ff1ffd350bc889738523659e7972";
function getHost(name) {
    switch (name) {
        case "mainnet":
            return "rpc.ankr.com/eth";
        case "goerli":
            return "rpc.ankr.com/eth_goerli";
        case "matic":
            return "rpc.ankr.com/polygon";
        case "arbitrum":
            return "rpc.ankr.com/arbitrum";
    }
    (0,_utils_index_js__WEBPACK_IMPORTED_MODULE_0__.assertArgument)(false, "unsupported network", "network", name);
}
/**
 *  The **AnkrProvider** connects to the [[link-ankr]]
 *  JSON-RPC end-points.
 *
 *  By default, a highly-throttled API key is used, which is
 *  appropriate for quick prototypes and simple scripts. To
 *  gain access to an increased rate-limit, it is highly
 *  recommended to [sign up here](link-ankr-signup).
 */
class AnkrProvider extends _provider_jsonrpc_js__WEBPACK_IMPORTED_MODULE_1__.JsonRpcProvider {
    /**
     *  The API key for the Ankr connection.
     */
    apiKey;
    /**
     *  Create a new **AnkrProvider**.
     *
     *  By default connecting to ``mainnet`` with a highly throttled
     *  API key.
     */
    constructor(_network, apiKey) {
        if (_network == null) {
            _network = "mainnet";
        }
        const network = _network_js__WEBPACK_IMPORTED_MODULE_2__.Network.from(_network);
        if (apiKey == null) {
            apiKey = defaultApiKey;
        }
        // Ankr does not support filterId, so we force polling
        const options = { polling: true, staticNetwork: network };
        const request = AnkrProvider.getRequest(network, apiKey);
        super(request, network, options);
        (0,_utils_index_js__WEBPACK_IMPORTED_MODULE_3__.defineProperties)(this, { apiKey });
    }
    _getProvider(chainId) {
        try {
            return new AnkrProvider(chainId, this.apiKey);
        }
        catch (error) { }
        return super._getProvider(chainId);
    }
    /**
     *  Returns a prepared request for connecting to %%network%% with
     *  %%apiKey%%.
     */
    static getRequest(network, apiKey) {
        if (apiKey == null) {
            apiKey = defaultApiKey;
        }
        const request = new _utils_index_js__WEBPACK_IMPORTED_MODULE_4__.FetchRequest(`https:/\/${getHost(network.name)}/${apiKey}`);
        request.allowGzip = true;
        if (apiKey === defaultApiKey) {
            request.retryFunc = async (request, response, attempt) => {
                (0,_community_js__WEBPACK_IMPORTED_MODULE_5__.showThrottleMessage)("AnkrProvider");
                return true;
            };
        }
        return request;
    }
    getRpcError(payload, error) {
        if (payload.method === "eth_sendRawTransaction") {
            if (error && error.error && error.error.message === "INTERNAL_ERROR: could not replace existing tx") {
                error.error.message = "replacement transaction underpriced";
            }
        }
        return super.getRpcError(payload, error);
    }
    isCommunityResource() {
        return (this.apiKey === defaultApiKey);
    }
}
//# sourceMappingURL=provider-ankr.js.map

/***/ }),

/***/ "./node_modules/ethers/lib.esm/providers/provider-browser.js":
/*!*******************************************************************!*\
  !*** ./node_modules/ethers/lib.esm/providers/provider-browser.js ***!
  \*******************************************************************/
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "BrowserProvider": () => (/* binding */ BrowserProvider)
/* harmony export */ });
/* harmony import */ var _utils_index_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../utils/index.js */ "./node_modules/ethers/lib.esm/utils/errors.js");
/* harmony import */ var _provider_jsonrpc_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./provider-jsonrpc.js */ "./node_modules/ethers/lib.esm/providers/provider-jsonrpc.js");


;
class BrowserProvider extends _provider_jsonrpc_js__WEBPACK_IMPORTED_MODULE_0__.JsonRpcApiPollingProvider {
    #request;
    constructor(ethereum, network) {
        super(network, { batchMaxCount: 1 });
        this.#request = async (method, params) => {
            const payload = { method, params };
            this.emit("debug", { action: "sendEip1193Request", payload });
            try {
                const result = await ethereum.request(payload);
                this.emit("debug", { action: "receiveEip1193Result", result });
                return result;
            }
            catch (e) {
                const error = new Error(e.message);
                error.code = e.code;
                error.data = e.data;
                error.payload = payload;
                this.emit("debug", { action: "receiveEip1193Error", error });
                throw error;
            }
        };
    }
    async send(method, params) {
        await this._start();
        return await super.send(method, params);
    }
    async _send(payload) {
        (0,_utils_index_js__WEBPACK_IMPORTED_MODULE_1__.assertArgument)(!Array.isArray(payload), "EIP-1193 does not support batch request", "payload", payload);
        try {
            const result = await this.#request(payload.method, payload.params || []);
            return [{ id: payload.id, result }];
        }
        catch (e) {
            return [{
                    id: payload.id,
                    error: { code: e.code, data: e.data, message: e.message }
                }];
        }
    }
    getRpcError(payload, error) {
        error = JSON.parse(JSON.stringify(error));
        // EIP-1193 gives us some machine-readable error codes, so rewrite
        // them into 
        switch (error.error.code || -1) {
            case 4001:
                error.error.message = `ethers-user-denied: ${error.error.message}`;
                break;
            case 4200:
                error.error.message = `ethers-unsupported: ${error.error.message}`;
                break;
        }
        return super.getRpcError(payload, error);
    }
    async hasSigner(address) {
        if (address == null) {
            address = 0;
        }
        const accounts = await this.send("eth_accounts", []);
        if (typeof (address) === "number") {
            return (accounts.length > address);
        }
        address = address.toLowerCase();
        return accounts.filter((a) => (a.toLowerCase() === address)).length !== 0;
    }
    async getSigner(address) {
        if (address == null) {
            address = 0;
        }
        if (!(await this.hasSigner(address))) {
            try {
                //const resp = 
                await this.#request("eth_requestAccounts", []);
                //console.log("RESP", resp);
            }
            catch (error) {
                const payload = error.payload;
                throw this.getRpcError(payload, { id: payload.id, error });
            }
        }
        return await super.getSigner(address);
    }
}
//# sourceMappingURL=provider-browser.js.map

/***/ }),

/***/ "./node_modules/ethers/lib.esm/providers/provider-cloudflare.js":
/*!**********************************************************************!*\
  !*** ./node_modules/ethers/lib.esm/providers/provider-cloudflare.js ***!
  \**********************************************************************/
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "CloudflareProvider": () => (/* binding */ CloudflareProvider)
/* harmony export */ });
/* harmony import */ var _utils_index_js__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ../utils/index.js */ "./node_modules/ethers/lib.esm/utils/errors.js");
/* harmony import */ var _network_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./network.js */ "./node_modules/ethers/lib.esm/providers/network.js");
/* harmony import */ var _provider_jsonrpc_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./provider-jsonrpc.js */ "./node_modules/ethers/lib.esm/providers/provider-jsonrpc.js");
/**
 *  About Cloudflare
 *
 *  @_subsection: api/providers/thirdparty:Cloudflare  [providers-cloudflare]
 */



/**
 *  About Cloudflare...
 */
class CloudflareProvider extends _provider_jsonrpc_js__WEBPACK_IMPORTED_MODULE_0__.JsonRpcProvider {
    constructor(_network) {
        if (_network == null) {
            _network = "mainnet";
        }
        const network = _network_js__WEBPACK_IMPORTED_MODULE_1__.Network.from(_network);
        (0,_utils_index_js__WEBPACK_IMPORTED_MODULE_2__.assertArgument)(network.name === "mainnet", "unsupported network", "network", _network);
        super("https:/\/cloudflare-eth.com/", network, { staticNetwork: network });
    }
}
//# sourceMappingURL=provider-cloudflare.js.map

/***/ }),

/***/ "./node_modules/ethers/lib.esm/providers/provider-etherscan.js":
/*!*********************************************************************!*\
  !*** ./node_modules/ethers/lib.esm/providers/provider-etherscan.js ***!
  \*********************************************************************/
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "EtherscanPlugin": () => (/* binding */ EtherscanPlugin),
/* harmony export */   "EtherscanProvider": () => (/* binding */ EtherscanProvider)
/* harmony export */ });
/* harmony import */ var _abi_index_js__WEBPACK_IMPORTED_MODULE_11__ = __webpack_require__(/*! ../abi/index.js */ "./node_modules/ethers/lib.esm/abi/abi-coder.js");
/* harmony import */ var _contract_index_js__WEBPACK_IMPORTED_MODULE_13__ = __webpack_require__(/*! ../contract/index.js */ "./node_modules/ethers/lib.esm/contract/contract.js");
/* harmony import */ var _transaction_index_js__WEBPACK_IMPORTED_MODULE_9__ = __webpack_require__(/*! ../transaction/index.js */ "./node_modules/ethers/lib.esm/transaction/accesslist.js");
/* harmony import */ var _transaction_index_js__WEBPACK_IMPORTED_MODULE_12__ = __webpack_require__(/*! ../transaction/index.js */ "./node_modules/ethers/lib.esm/transaction/transaction.js");
/* harmony import */ var _utils_index_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../utils/index.js */ "./node_modules/ethers/lib.esm/utils/properties.js");
/* harmony import */ var _utils_index_js__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ../utils/index.js */ "./node_modules/ethers/lib.esm/utils/errors.js");
/* harmony import */ var _utils_index_js__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! ../utils/index.js */ "./node_modules/ethers/lib.esm/utils/fetch.js");
/* harmony import */ var _utils_index_js__WEBPACK_IMPORTED_MODULE_7__ = __webpack_require__(/*! ../utils/index.js */ "./node_modules/ethers/lib.esm/utils/utf8.js");
/* harmony import */ var _utils_index_js__WEBPACK_IMPORTED_MODULE_8__ = __webpack_require__(/*! ../utils/index.js */ "./node_modules/ethers/lib.esm/utils/maths.js");
/* harmony import */ var _utils_index_js__WEBPACK_IMPORTED_MODULE_10__ = __webpack_require__(/*! ../utils/index.js */ "./node_modules/ethers/lib.esm/utils/data.js");
/* harmony import */ var _abstract_provider_js__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./abstract-provider.js */ "./node_modules/ethers/lib.esm/providers/abstract-provider.js");
/* harmony import */ var _network_js__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./network.js */ "./node_modules/ethers/lib.esm/providers/network.js");
/* harmony import */ var _plugins_network_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./plugins-network.js */ "./node_modules/ethers/lib.esm/providers/plugins-network.js");
/* harmony import */ var _community_js__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! ./community.js */ "./node_modules/ethers/lib.esm/providers/community.js");
/**
 *  [[link-etherscan]] provides a third-party service for connecting to
 *  various blockchains over a combination of JSON-RPC and custom API
 *  endpoints.
 *
 *  **Supported Networks**
 *
 *  - Ethereum Mainnet (``mainnet``)
 *  - Goerli Testnet (``goerli``)
 *  - Sepolia Testnet (``sepolia``)
 *  - Arbitrum (``arbitrum``)
 *  - Arbitrum Goerli Testnet (``arbitrum-goerli``)
 *  - Optimism (``optimism``)
 *  - Optimism Goerli Testnet (``optimism-goerli``)
 *  - Polygon (``matic``)
 *  - Polygon Mumbai Testnet (``matic-mumbai``)
 *
 *  @_subsection api/providers/thirdparty:Etherscan  [providers-etherscan]
 */








const THROTTLE = 2000;
function isPromise(value) {
    return (value && typeof (value.then) === "function");
}
const EtherscanPluginId = "org.ethers.plugins.provider.Etherscan";
/**
 *  A Network can include an **EtherscanPlugin** to provide
 *  a custom base URL.
 *
 *  @_docloc: api/providers/thirdparty:Etherscan
 */
class EtherscanPlugin extends _plugins_network_js__WEBPACK_IMPORTED_MODULE_0__.NetworkPlugin {
    /**
     *  The Etherscan API base URL.
     */
    baseUrl;
    /**
     *  Creates a new **EtherscanProvider** which will use
     *  %%baseUrl%%.
     */
    constructor(baseUrl) {
        super(EtherscanPluginId);
        (0,_utils_index_js__WEBPACK_IMPORTED_MODULE_1__.defineProperties)(this, { baseUrl });
    }
    clone() {
        return new EtherscanPlugin(this.baseUrl);
    }
}
let nextId = 1;
/**
 *  The **EtherscanBaseProvider** is the super-class of
 *  [[EtherscanProvider]], which should generally be used instead.
 *
 *  Since the **EtherscanProvider** includes additional code for
 *  [[Contract]] access, in //rare cases// that contracts are not
 *  used, this class can reduce code size.
 *
 *  @_docloc: api/providers/thirdparty:Etherscan
 */
class EtherscanProvider extends _abstract_provider_js__WEBPACK_IMPORTED_MODULE_2__.AbstractProvider {
    /**
     *  The connected network.
     */
    network;
    /**
     *  The API key or null if using the community provided bandwidth.
     */
    apiKey;
    #plugin;
    /**
     *  Creates a new **EtherscanBaseProvider**.
     */
    constructor(_network, _apiKey) {
        const apiKey = (_apiKey != null) ? _apiKey : null;
        super();
        const network = _network_js__WEBPACK_IMPORTED_MODULE_3__.Network.from(_network);
        this.#plugin = network.getPlugin(EtherscanPluginId);
        (0,_utils_index_js__WEBPACK_IMPORTED_MODULE_1__.defineProperties)(this, { apiKey, network });
        // Test that the network is supported by Etherscan
        this.getBaseUrl();
    }
    /**
     *  Returns the base URL.
     *
     *  If an [[EtherscanPlugin]] is configured on the
     *  [[EtherscanBaseProvider_network]], returns the plugin's
     *  baseUrl.
     */
    getBaseUrl() {
        if (this.#plugin) {
            return this.#plugin.baseUrl;
        }
        switch (this.network.name) {
            case "mainnet":
                return "https:/\/api.etherscan.io";
            case "goerli":
                return "https:/\/api-goerli.etherscan.io";
            case "sepolia":
                return "https:/\/api-sepolia.etherscan.io";
            case "arbitrum":
                return "https:/\/api.arbiscan.io";
            case "arbitrum-goerli":
                return "https:/\/api-goerli.arbiscan.io";
            case "matic":
                return "https:/\/api.polygonscan.com";
            case "matic-mumbai":
                return "https:/\/api-testnet.polygonscan.com";
            case "optimism":
                return "https:/\/api-optimistic.etherscan.io";
            case "optimism-goerli":
                return "https:/\/api-goerli-optimistic.etherscan.io";
            default:
        }
        (0,_utils_index_js__WEBPACK_IMPORTED_MODULE_4__.assertArgument)(false, "unsupported network", "network", this.network);
    }
    /**
     *  Returns the URL for the %%module%% and %%params%%.
     */
    getUrl(module, params) {
        const query = Object.keys(params).reduce((accum, key) => {
            const value = params[key];
            if (value != null) {
                accum += `&${key}=${value}`;
            }
            return accum;
        }, "");
        const apiKey = ((this.apiKey) ? `&apikey=${this.apiKey}` : "");
        return `${this.getBaseUrl()}/api?module=${module}${query}${apiKey}`;
    }
    /**
     *  Returns the URL for using POST requests.
     */
    getPostUrl() {
        return `${this.getBaseUrl()}/api`;
    }
    /**
     *  Returns the parameters for using POST requests.
     */
    getPostData(module, params) {
        params.module = module;
        params.apikey = this.apiKey;
        return params;
    }
    async detectNetwork() {
        return this.network;
    }
    /**
     *  Resolves to the result of calling %%module%% with %%params%%.
     *
     *  If %%post%%, the request is made as a POST request.
     */
    async fetch(module, params, post) {
        const id = nextId++;
        const url = (post ? this.getPostUrl() : this.getUrl(module, params));
        const payload = (post ? this.getPostData(module, params) : null);
        this.emit("debug", { action: "sendRequest", id, url, payload: payload });
        const request = new _utils_index_js__WEBPACK_IMPORTED_MODULE_5__.FetchRequest(url);
        request.setThrottleParams({ slotInterval: 1000 });
        request.retryFunc = (req, resp, attempt) => {
            if (this.isCommunityResource()) {
                (0,_community_js__WEBPACK_IMPORTED_MODULE_6__.showThrottleMessage)("Etherscan");
            }
            return Promise.resolve(true);
        };
        request.processFunc = async (request, response) => {
            const result = response.hasBody() ? JSON.parse((0,_utils_index_js__WEBPACK_IMPORTED_MODULE_7__.toUtf8String)(response.body)) : {};
            const throttle = ((typeof (result.result) === "string") ? result.result : "").toLowerCase().indexOf("rate limit") >= 0;
            if (module === "proxy") {
                // This JSON response indicates we are being throttled
                if (result && result.status == 0 && result.message == "NOTOK" && throttle) {
                    this.emit("debug", { action: "receiveError", id, reason: "proxy-NOTOK", error: result });
                    response.throwThrottleError(result.result, THROTTLE);
                }
            }
            else {
                if (throttle) {
                    this.emit("debug", { action: "receiveError", id, reason: "null result", error: result.result });
                    response.throwThrottleError(result.result, THROTTLE);
                }
            }
            return response;
        };
        if (payload) {
            request.setHeader("content-type", "application/x-www-form-urlencoded; charset=UTF-8");
            request.body = Object.keys(payload).map((k) => `${k}=${payload[k]}`).join("&");
        }
        const response = await request.send();
        try {
            response.assertOk();
        }
        catch (error) {
            this.emit("debug", { action: "receiveError", id, error, reason: "assertOk" });
            (0,_utils_index_js__WEBPACK_IMPORTED_MODULE_4__.assert)(false, "response error", "SERVER_ERROR", { request, response });
        }
        if (!response.hasBody()) {
            this.emit("debug", { action: "receiveError", id, error: "missing body", reason: "null body" });
            (0,_utils_index_js__WEBPACK_IMPORTED_MODULE_4__.assert)(false, "missing response", "SERVER_ERROR", { request, response });
        }
        const result = JSON.parse((0,_utils_index_js__WEBPACK_IMPORTED_MODULE_7__.toUtf8String)(response.body));
        if (module === "proxy") {
            if (result.jsonrpc != "2.0") {
                this.emit("debug", { action: "receiveError", id, result, reason: "invalid JSON-RPC" });
                (0,_utils_index_js__WEBPACK_IMPORTED_MODULE_4__.assert)(false, "invalid JSON-RPC response (missing jsonrpc='2.0')", "SERVER_ERROR", { request, response, info: { result } });
            }
            if (result.error) {
                this.emit("debug", { action: "receiveError", id, result, reason: "JSON-RPC error" });
                (0,_utils_index_js__WEBPACK_IMPORTED_MODULE_4__.assert)(false, "error response", "SERVER_ERROR", { request, response, info: { result } });
            }
            this.emit("debug", { action: "receiveRequest", id, result });
            return result.result;
        }
        else {
            // getLogs, getHistory have weird success responses
            if (result.status == 0 && (result.message === "No records found" || result.message === "No transactions found")) {
                this.emit("debug", { action: "receiveRequest", id, result });
                return result.result;
            }
            if (result.status != 1 || (typeof (result.message) === "string" && !result.message.match(/^OK/))) {
                this.emit("debug", { action: "receiveError", id, result });
                (0,_utils_index_js__WEBPACK_IMPORTED_MODULE_4__.assert)(false, "error response", "SERVER_ERROR", { request, response, info: { result } });
            }
            this.emit("debug", { action: "receiveRequest", id, result });
            return result.result;
        }
    }
    /**
     *  Returns %%transaction%% normalized for the Etherscan API.
     */
    _getTransactionPostData(transaction) {
        const result = {};
        for (let key in transaction) {
            if (transaction[key] == null) {
                continue;
            }
            let value = transaction[key];
            if (key === "type" && value === 0) {
                continue;
            }
            // Quantity-types require no leading zero, unless 0
            if ({ type: true, gasLimit: true, gasPrice: true, maxFeePerGs: true, maxPriorityFeePerGas: true, nonce: true, value: true }[key]) {
                value = (0,_utils_index_js__WEBPACK_IMPORTED_MODULE_8__.toQuantity)(value);
            }
            else if (key === "accessList") {
                value = "[" + (0,_transaction_index_js__WEBPACK_IMPORTED_MODULE_9__.accessListify)(value).map((set) => {
                    return `{address:"${set.address}",storageKeys:["${set.storageKeys.join('","')}"]}`;
                }).join(",") + "]";
            }
            else {
                value = (0,_utils_index_js__WEBPACK_IMPORTED_MODULE_10__.hexlify)(value);
            }
            result[key] = value;
        }
        return result;
    }
    /**
     *  Throws the normalized Etherscan error.
     */
    _checkError(req, error, transaction) {
        // Pull any message out if, possible
        let message = "";
        if ((0,_utils_index_js__WEBPACK_IMPORTED_MODULE_4__.isError)(error, "SERVER_ERROR")) {
            // Check for an error emitted by a proxy call
            try {
                message = error.info.result.error.message;
            }
            catch (e) { }
            if (!message) {
                try {
                    message = error.info.message;
                }
                catch (e) { }
            }
        }
        if (req.method === "estimateGas") {
            if (!message.match(/revert/i) && message.match(/insufficient funds/i)) {
                (0,_utils_index_js__WEBPACK_IMPORTED_MODULE_4__.assert)(false, "insufficient funds", "INSUFFICIENT_FUNDS", {
                    transaction: req.transaction
                });
            }
        }
        if (req.method === "call" || req.method === "estimateGas") {
            if (message.match(/execution reverted/i)) {
                let data = "";
                try {
                    data = error.info.result.error.data;
                }
                catch (error) { }
                const e = _abi_index_js__WEBPACK_IMPORTED_MODULE_11__.AbiCoder.getBuiltinCallException(req.method, req.transaction, data);
                e.info = { request: req, error };
                throw e;
            }
        }
        if (message) {
            if (req.method === "broadcastTransaction") {
                const transaction = _transaction_index_js__WEBPACK_IMPORTED_MODULE_12__.Transaction.from(req.signedTransaction);
                if (message.match(/replacement/i) && message.match(/underpriced/i)) {
                    (0,_utils_index_js__WEBPACK_IMPORTED_MODULE_4__.assert)(false, "replacement fee too low", "REPLACEMENT_UNDERPRICED", {
                        transaction
                    });
                }
                if (message.match(/insufficient funds/)) {
                    (0,_utils_index_js__WEBPACK_IMPORTED_MODULE_4__.assert)(false, "insufficient funds for intrinsic transaction cost", "INSUFFICIENT_FUNDS", {
                        transaction
                    });
                }
                if (message.match(/same hash was already imported|transaction nonce is too low|nonce too low/)) {
                    (0,_utils_index_js__WEBPACK_IMPORTED_MODULE_4__.assert)(false, "nonce has already been used", "NONCE_EXPIRED", {
                        transaction
                    });
                }
            }
        }
        // Something we could not process
        throw error;
    }
    async _detectNetwork() {
        return this.network;
    }
    async _perform(req) {
        switch (req.method) {
            case "chainId":
                return this.network.chainId;
            case "getBlockNumber":
                return this.fetch("proxy", { action: "eth_blockNumber" });
            case "getGasPrice":
                return this.fetch("proxy", { action: "eth_gasPrice" });
            case "getBalance":
                // Returns base-10 result
                return this.fetch("account", {
                    action: "balance",
                    address: req.address,
                    tag: req.blockTag
                });
            case "getTransactionCount":
                return this.fetch("proxy", {
                    action: "eth_getTransactionCount",
                    address: req.address,
                    tag: req.blockTag
                });
            case "getCode":
                return this.fetch("proxy", {
                    action: "eth_getCode",
                    address: req.address,
                    tag: req.blockTag
                });
            case "getStorage":
                return this.fetch("proxy", {
                    action: "eth_getStorageAt",
                    address: req.address,
                    position: req.position,
                    tag: req.blockTag
                });
            case "broadcastTransaction":
                return this.fetch("proxy", {
                    action: "eth_sendRawTransaction",
                    hex: req.signedTransaction
                }, true).catch((error) => {
                    return this._checkError(req, error, req.signedTransaction);
                });
            case "getBlock":
                if ("blockTag" in req) {
                    return this.fetch("proxy", {
                        action: "eth_getBlockByNumber",
                        tag: req.blockTag,
                        boolean: (req.includeTransactions ? "true" : "false")
                    });
                }
                (0,_utils_index_js__WEBPACK_IMPORTED_MODULE_4__.assert)(false, "getBlock by blockHash not supported by Etherscan", "UNSUPPORTED_OPERATION", {
                    operation: "getBlock(blockHash)"
                });
            case "getTransaction":
                return this.fetch("proxy", {
                    action: "eth_getTransactionByHash",
                    txhash: req.hash
                });
            case "getTransactionReceipt":
                return this.fetch("proxy", {
                    action: "eth_getTransactionReceipt",
                    txhash: req.hash
                });
            case "call": {
                if (req.blockTag !== "latest") {
                    throw new Error("EtherscanProvider does not support blockTag for call");
                }
                const postData = this._getTransactionPostData(req.transaction);
                postData.module = "proxy";
                postData.action = "eth_call";
                try {
                    return await this.fetch("proxy", postData, true);
                }
                catch (error) {
                    return this._checkError(req, error, req.transaction);
                }
            }
            case "estimateGas": {
                const postData = this._getTransactionPostData(req.transaction);
                postData.module = "proxy";
                postData.action = "eth_estimateGas";
                try {
                    return await this.fetch("proxy", postData, true);
                }
                catch (error) {
                    return this._checkError(req, error, req.transaction);
                }
            }
            /*
                        case "getLogs": {
                            // Needs to complain if more than one address is passed in
                            const args: Record<string, any> = { action: "getLogs" }
            
                            if (params.filter.fromBlock) {
                                args.fromBlock = checkLogTag(params.filter.fromBlock);
                            }
            
                            if (params.filter.toBlock) {
                                args.toBlock = checkLogTag(params.filter.toBlock);
                            }
            
                            if (params.filter.address) {
                                args.address = params.filter.address;
                            }
            
                            // @TODO: We can handle slightly more complicated logs using the logs API
                            if (params.filter.topics && params.filter.topics.length > 0) {
                                if (params.filter.topics.length > 1) {
                                    logger.throwError("unsupported topic count", Logger.Errors.UNSUPPORTED_OPERATION, { topics: params.filter.topics });
                                }
                                if (params.filter.topics.length === 1) {
                                    const topic0 = params.filter.topics[0];
                                    if (typeof(topic0) !== "string" || topic0.length !== 66) {
                                        logger.throwError("unsupported topic format", Logger.Errors.UNSUPPORTED_OPERATION, { topic0: topic0 });
                                    }
                                    args.topic0 = topic0;
                                }
                            }
            
                            const logs: Array<any> = await this.fetch("logs", args);
            
                            // Cache txHash => blockHash
                            let blocks: { [tag: string]: string } = {};
            
                            // Add any missing blockHash to the logs
                            for (let i = 0; i < logs.length; i++) {
                                const log = logs[i];
                                if (log.blockHash != null) { continue; }
                                if (blocks[log.blockNumber] == null) {
                                    const block = await this.getBlock(log.blockNumber);
                                    if (block) {
                                        blocks[log.blockNumber] = block.hash;
                                    }
                                }
            
                                log.blockHash = blocks[log.blockNumber];
                            }
            
                            return logs;
                        }
            */
            default:
                break;
        }
        return super._perform(req);
    }
    async getNetwork() {
        return this.network;
    }
    /**
     *  Resolves to the current price of ether.
     *
     *  This returns ``0`` on any network other than ``mainnet``.
     */
    async getEtherPrice() {
        if (this.network.name !== "mainnet") {
            return 0.0;
        }
        return parseFloat((await this.fetch("stats", { action: "ethprice" })).ethusd);
    }
    /**
     *  Resolves to a [Contract]] for %%address%%, using the
     *  Etherscan API to retreive the Contract ABI.
     */
    async getContract(_address) {
        let address = this._getAddress(_address);
        if (isPromise(address)) {
            address = await address;
        }
        try {
            const resp = await this.fetch("contract", {
                action: "getabi", address
            });
            const abi = JSON.parse(resp);
            return new _contract_index_js__WEBPACK_IMPORTED_MODULE_13__.Contract(address, abi, this);
        }
        catch (error) {
            return null;
        }
    }
    isCommunityResource() {
        return (this.apiKey == null);
    }
}
//# sourceMappingURL=provider-etherscan.js.map

/***/ }),

/***/ "./node_modules/ethers/lib.esm/providers/provider-fallback.js":
/*!********************************************************************!*\
  !*** ./node_modules/ethers/lib.esm/providers/provider-fallback.js ***!
  \********************************************************************/
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "FallbackProvider": () => (/* binding */ FallbackProvider)
/* harmony export */ });
/* harmony import */ var _utils_index_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../utils/index.js */ "./node_modules/ethers/lib.esm/utils/maths.js");
/* harmony import */ var _utils_index_js__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ../utils/index.js */ "./node_modules/ethers/lib.esm/utils/errors.js");
/* harmony import */ var _abstract_provider_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./abstract-provider.js */ "./node_modules/ethers/lib.esm/providers/abstract-provider.js");
/* harmony import */ var _network_js__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./network.js */ "./node_modules/ethers/lib.esm/providers/network.js");
/**
 *  Explain all the nitty-gritty about the **FallbackProvider**.
 *
 *  @_section: api/providers/fallback-provider:Fallback Provider [about-fallback-provider]
 */



const BN_1 = BigInt("1");
const BN_2 = BigInt("2");
function shuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        const tmp = array[i];
        array[i] = array[j];
        array[j] = tmp;
    }
}
function stall(duration) {
    return new Promise((resolve) => { setTimeout(resolve, duration); });
}
function getTime() { return (new Date()).getTime(); }
function stringify(value) {
    return JSON.stringify(value, (key, value) => {
        if (typeof (value) === "bigint") {
            return { type: "bigint", value: value.toString() };
        }
        return value;
    });
}
;
const defaultConfig = { stallTimeout: 400, priority: 1, weight: 1 };
const defaultState = {
    blockNumber: -2, requests: 0, lateResponses: 0, errorResponses: 0,
    outOfSync: -1, unsupportedEvents: 0, rollingDuration: 0, score: 0,
    _network: null, _updateNumber: null, _totalTime: 0
};
async function waitForSync(config, blockNumber) {
    while (config.blockNumber < 0 || config.blockNumber < blockNumber) {
        if (!config._updateNumber) {
            config._updateNumber = (async () => {
                const blockNumber = await config.provider.getBlockNumber();
                if (blockNumber > config.blockNumber) {
                    config.blockNumber = blockNumber;
                }
                config._updateNumber = null;
            })();
        }
        await config._updateNumber;
        config.outOfSync++;
    }
}
function _normalize(value) {
    if (value == null) {
        return "null";
    }
    if (Array.isArray(value)) {
        return "[" + (value.map(_normalize)).join(",") + "]";
    }
    if (typeof (value) === "object" && typeof (value.toJSON) === "function") {
        return _normalize(value.toJSON());
    }
    switch (typeof (value)) {
        case "boolean":
        case "symbol":
            return value.toString();
        case "bigint":
        case "number":
            return BigInt(value).toString();
        case "string":
            return JSON.stringify(value);
        case "object": {
            const keys = Object.keys(value);
            keys.sort();
            return "{" + keys.map((k) => `${JSON.stringify(k)}:${_normalize(value[k])}`).join(",") + "}";
        }
    }
    console.log("Could not serialize", value);
    throw new Error("Hmm...");
}
function normalizeResult(value) {
    if ("error" in value) {
        const error = value.error;
        return { tag: _normalize(error), value: error };
    }
    const result = value.result;
    return { tag: _normalize(result), value: result };
}
// This strategy picks the highest weight result, as long as the weight is
// equal to or greater than quorum
function checkQuorum(quorum, results) {
    const tally = new Map();
    for (const { value, tag, weight } of results) {
        const t = tally.get(tag) || { value, weight: 0 };
        t.weight += weight;
        tally.set(tag, t);
    }
    let best = null;
    for (const r of tally.values()) {
        if (r.weight >= quorum && (!best || r.weight > best.weight)) {
            best = r;
        }
    }
    if (best) {
        return best.value;
    }
    return undefined;
}
function getMedian(quorum, results) {
    let resultWeight = 0;
    const errorMap = new Map();
    let bestError = null;
    const values = [];
    for (const { value, tag, weight } of results) {
        if (value instanceof Error) {
            const e = errorMap.get(tag) || { value, weight: 0 };
            e.weight += weight;
            errorMap.set(tag, e);
            if (bestError == null || e.weight > bestError.weight) {
                bestError = e;
            }
        }
        else {
            values.push(BigInt(value));
            resultWeight += weight;
        }
    }
    if (resultWeight < quorum) {
        // We have quorum for an error
        if (bestError && bestError.weight >= quorum) {
            return bestError.value;
        }
        // We do not have quorum for a result
        return undefined;
    }
    // Get the sorted values
    values.sort((a, b) => ((a < b) ? -1 : (b > a) ? 1 : 0));
    const mid = Math.floor(values.length / 2);
    // Odd-length; take the middle value
    if (values.length % 2) {
        return values[mid];
    }
    // Even length; take the ceiling of the mean of the center two values
    return (values[mid - 1] + values[mid] + BN_1) / BN_2;
}
function getAnyResult(quorum, results) {
    // If any value or error meets quorum, that is our preferred result
    const result = checkQuorum(quorum, results);
    if (result !== undefined) {
        return result;
    }
    // Otherwise, do we have any result?
    for (const r of results) {
        if (r.value) {
            return r.value;
        }
    }
    // Nope!
    return undefined;
}
function getFuzzyMode(quorum, results) {
    if (quorum === 1) {
        return (0,_utils_index_js__WEBPACK_IMPORTED_MODULE_0__.getNumber)(getMedian(quorum, results), "%internal");
    }
    const tally = new Map();
    const add = (result, weight) => {
        const t = tally.get(result) || { result, weight: 0 };
        t.weight += weight;
        tally.set(result, t);
    };
    for (const { weight, value } of results) {
        const r = (0,_utils_index_js__WEBPACK_IMPORTED_MODULE_0__.getNumber)(value);
        add(r - 1, weight);
        add(r, weight);
        add(r + 1, weight);
    }
    let bestWeight = 0;
    let bestResult = undefined;
    for (const { weight, result } of tally.values()) {
        // Use this result, if this result meets quorum and has either:
        // - a better weight
        // - or equal weight, but the result is larger
        if (weight >= quorum && (weight > bestWeight || (bestResult != null && weight === bestWeight && result > bestResult))) {
            bestWeight = weight;
            bestResult = result;
        }
    }
    return bestResult;
}
/**
 *  A Fallback Provider.
 *
 */
class FallbackProvider extends _abstract_provider_js__WEBPACK_IMPORTED_MODULE_1__.AbstractProvider {
    quorum;
    eventQuorum;
    eventWorkers;
    #configs;
    #height;
    #initialSyncPromise;
    constructor(providers, network) {
        super(network);
        this.#configs = providers.map((p) => {
            if (p instanceof _abstract_provider_js__WEBPACK_IMPORTED_MODULE_1__.AbstractProvider) {
                return Object.assign({ provider: p }, defaultConfig, defaultState);
            }
            else {
                return Object.assign({}, defaultConfig, p, defaultState);
            }
        });
        this.#height = -2;
        this.#initialSyncPromise = null;
        this.quorum = 2; //Math.ceil(providers.length /  2);
        this.eventQuorum = 1;
        this.eventWorkers = 1;
        (0,_utils_index_js__WEBPACK_IMPORTED_MODULE_2__.assertArgument)(this.quorum <= this.#configs.reduce((a, c) => (a + c.weight), 0), "quorum exceed provider wieght", "quorum", this.quorum);
    }
    get providerConfigs() {
        return this.#configs.map((c) => {
            const result = Object.assign({}, c);
            for (const key in result) {
                if (key[0] === "_") {
                    delete result[key];
                }
            }
            return result;
        });
    }
    async _detectNetwork() {
        return _network_js__WEBPACK_IMPORTED_MODULE_3__.Network.from((0,_utils_index_js__WEBPACK_IMPORTED_MODULE_0__.getBigInt)(await this._perform({ method: "chainId" })));
    }
    // @TODO: Add support to select providers to be the event subscriber
    //_getSubscriber(sub: Subscription): Subscriber {
    //    throw new Error("@TODO");
    //}
    async _translatePerform(provider, req) {
        switch (req.method) {
            case "broadcastTransaction":
                return await provider.broadcastTransaction(req.signedTransaction);
            case "call":
                return await provider.call(Object.assign({}, req.transaction, { blockTag: req.blockTag }));
            case "chainId":
                return (await provider.getNetwork()).chainId;
            case "estimateGas":
                return await provider.estimateGas(req.transaction);
            case "getBalance":
                return await provider.getBalance(req.address, req.blockTag);
            case "getBlock": {
                const block = ("blockHash" in req) ? req.blockHash : req.blockTag;
                return await provider.getBlock(block, req.includeTransactions);
            }
            case "getBlockNumber":
                return await provider.getBlockNumber();
            case "getCode":
                return await provider.getCode(req.address, req.blockTag);
            case "getGasPrice":
                return (await provider.getFeeData()).gasPrice;
            case "getLogs":
                return await provider.getLogs(req.filter);
            case "getStorage":
                return await provider.getStorage(req.address, req.position, req.blockTag);
            case "getTransaction":
                return await provider.getTransaction(req.hash);
            case "getTransactionCount":
                return await provider.getTransactionCount(req.address, req.blockTag);
            case "getTransactionReceipt":
                return await provider.getTransactionReceipt(req.hash);
            case "getTransactionResult":
                return await provider.getTransactionResult(req.hash);
        }
    }
    // Grab the next (random) config that is not already part of
    // the running set
    #getNextConfig(running) {
        // @TODO: Maybe do a check here to favour (heavily) providers that
        //        do not require waitForSync and disfavour providers that
        //        seem down-ish or are behaving slowly
        const configs = Array.from(running).map((r) => r.config);
        // Shuffle the states, sorted by priority
        const allConfigs = this.#configs.slice();
        shuffle(allConfigs);
        allConfigs.sort((a, b) => (b.priority - a.priority));
        for (const config of allConfigs) {
            if (configs.indexOf(config) === -1) {
                return config;
            }
        }
        return null;
    }
    // Adds a new runner (if available) to running.
    #addRunner(running, req) {
        const config = this.#getNextConfig(running);
        // No runners available
        if (config == null) {
            return null;
        }
        // Create a new runner
        const runner = {
            config, result: null, didBump: false,
            perform: null, staller: null
        };
        const now = getTime();
        // Start performing this operation
        runner.perform = (async () => {
            try {
                config.requests++;
                const result = await this._translatePerform(config.provider, req);
                runner.result = { result };
            }
            catch (error) {
                config.errorResponses++;
                runner.result = { error };
            }
            const dt = (getTime() - now);
            config._totalTime += dt;
            config.rollingDuration = 0.95 * config.rollingDuration + 0.05 * dt;
            runner.perform = null;
        })();
        // Start a staller; when this times out, it's time to force
        // kicking off another runner because we are taking too long
        runner.staller = (async () => {
            await stall(config.stallTimeout);
            runner.staller = null;
        })();
        running.add(runner);
        return runner;
    }
    // Initializes the blockNumber and network for each runner and
    // blocks until initialized
    async #initialSync() {
        let initialSync = this.#initialSyncPromise;
        if (!initialSync) {
            const promises = [];
            this.#configs.forEach((config) => {
                promises.push(waitForSync(config, 0));
                promises.push((async () => {
                    config._network = await config.provider.getNetwork();
                })());
            });
            this.#initialSyncPromise = initialSync = (async () => {
                // Wait for all providers to have a block number and network
                await Promise.all(promises);
                // Check all the networks match
                let chainId = null;
                for (const config of this.#configs) {
                    const network = (config._network);
                    if (chainId == null) {
                        chainId = network.chainId;
                    }
                    else if (network.chainId !== chainId) {
                        (0,_utils_index_js__WEBPACK_IMPORTED_MODULE_2__.assert)(false, "cannot mix providers on different networks", "UNSUPPORTED_OPERATION", {
                            operation: "new FallbackProvider"
                        });
                    }
                }
            })();
        }
        await initialSync;
    }
    async #checkQuorum(running, req) {
        // Get all the result objects
        const results = [];
        for (const runner of running) {
            if (runner.result != null) {
                const { tag, value } = normalizeResult(runner.result);
                results.push({ tag, value, weight: runner.config.weight });
            }
        }
        // Are there enough results to event meet quorum?
        if (results.reduce((a, r) => (a + r.weight), 0) < this.quorum) {
            return undefined;
        }
        switch (req.method) {
            case "getBlockNumber": {
                // We need to get the bootstrap block height
                if (this.#height === -2) {
                    this.#height = Math.ceil((0,_utils_index_js__WEBPACK_IMPORTED_MODULE_0__.getNumber)(getMedian(this.quorum, this.#configs.map((c) => ({
                        value: c.blockNumber,
                        tag: (0,_utils_index_js__WEBPACK_IMPORTED_MODULE_0__.getNumber)(c.blockNumber).toString(),
                        weight: c.weight
                    })))));
                }
                // Find the mode across all the providers, allowing for
                // a little drift between block heights
                const mode = getFuzzyMode(this.quorum, results);
                if (mode === undefined) {
                    return undefined;
                }
                if (mode > this.#height) {
                    this.#height = mode;
                }
                return this.#height;
            }
            case "getGasPrice":
            case "estimateGas":
                return getMedian(this.quorum, results);
            case "getBlock":
                // Pending blocks are in the mempool and already
                // quite untrustworthy; just grab anything
                if ("blockTag" in req && req.blockTag === "pending") {
                    return getAnyResult(this.quorum, results);
                }
                return checkQuorum(this.quorum, results);
            case "call":
            case "chainId":
            case "getBalance":
            case "getTransactionCount":
            case "getCode":
            case "getStorage":
            case "getTransaction":
            case "getTransactionReceipt":
            case "getLogs":
                return checkQuorum(this.quorum, results);
            case "broadcastTransaction":
                return getAnyResult(this.quorum, results);
        }
        (0,_utils_index_js__WEBPACK_IMPORTED_MODULE_2__.assert)(false, "unsupported method", "UNSUPPORTED_OPERATION", {
            operation: `_perform(${stringify(req.method)})`
        });
    }
    async #waitForQuorum(running, req) {
        if (running.size === 0) {
            throw new Error("no runners?!");
        }
        // Any promises that are interesting to watch for; an expired stall
        // or a successful perform
        const interesting = [];
        let newRunners = 0;
        for (const runner of running) {
            // No responses, yet; keep an eye on it
            if (runner.perform) {
                interesting.push(runner.perform);
            }
            // Still stalling...
            if (runner.staller) {
                interesting.push(runner.staller);
                continue;
            }
            // This runner has already triggered another runner
            if (runner.didBump) {
                continue;
            }
            // Got a response (result or error) or stalled; kick off another runner
            runner.didBump = true;
            newRunners++;
        }
        // Check if we have reached quorum on a result (or error)
        const value = await this.#checkQuorum(running, req);
        if (value !== undefined) {
            if (value instanceof Error) {
                throw value;
            }
            return value;
        }
        // Add any new runners, because a staller timed out or a result
        // or error response came in.
        for (let i = 0; i < newRunners; i++) {
            this.#addRunner(running, req);
        }
        // All providers have returned, and we have no result
        (0,_utils_index_js__WEBPACK_IMPORTED_MODULE_2__.assert)(interesting.length > 0, "quorum not met", "SERVER_ERROR", {
            request: "%sub-requests",
            info: { request: req, results: Array.from(running).map((r) => stringify(r.result)) }
        });
        // Wait for someone to either complete its perform or stall out
        await Promise.race(interesting);
        // This is recursive, but at worst case the depth is 2x the
        // number of providers (each has a perform and a staller)
        return await this.#waitForQuorum(running, req);
    }
    async _perform(req) {
        // Broadcasting a transaction is rare (ish) and already incurs
        // a cost on the user, so spamming is safe-ish. Just send it to
        // every backend.
        if (req.method === "broadcastTransaction") {
            const results = await Promise.all(this.#configs.map(async ({ provider, weight }) => {
                try {
                    const result = await provider._perform(req);
                    return Object.assign(normalizeResult({ result }), { weight });
                }
                catch (error) {
                    return Object.assign(normalizeResult({ error }), { weight });
                }
            }));
            const result = getAnyResult(this.quorum, results);
            (0,_utils_index_js__WEBPACK_IMPORTED_MODULE_2__.assert)(result !== undefined, "problem multi-broadcasting", "SERVER_ERROR", {
                request: "%sub-requests",
                info: { request: req, results: results.map(stringify) }
            });
            if (result instanceof Error) {
                throw result;
            }
            return result;
        }
        await this.#initialSync();
        // Bootstrap enough runners to meet quorum
        const running = new Set();
        for (let i = 0; i < this.quorum; i++) {
            this.#addRunner(running, req);
        }
        const result = await this.#waitForQuorum(running, req);
        // Track requests sent to a provider that are still
        // outstanding after quorum has been otherwise found
        for (const runner of running) {
            if (runner.perform && runner.result == null) {
                runner.config.lateResponses++;
            }
        }
        return result;
    }
    async destroy() {
        for (const { provider } of this.#configs) {
            provider.destroy();
        }
        super.destroy();
    }
}
//# sourceMappingURL=provider-fallback.js.map

/***/ }),

/***/ "./node_modules/ethers/lib.esm/providers/provider-infura.js":
/*!******************************************************************!*\
  !*** ./node_modules/ethers/lib.esm/providers/provider-infura.js ***!
  \******************************************************************/
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "InfuraProvider": () => (/* binding */ InfuraProvider),
/* harmony export */   "InfuraWebSocketProvider": () => (/* binding */ InfuraWebSocketProvider)
/* harmony export */ });
/* harmony import */ var _utils_index_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../utils/index.js */ "./node_modules/ethers/lib.esm/utils/errors.js");
/* harmony import */ var _utils_index_js__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ../utils/index.js */ "./node_modules/ethers/lib.esm/utils/properties.js");
/* harmony import */ var _utils_index_js__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! ../utils/index.js */ "./node_modules/ethers/lib.esm/utils/fetch.js");
/* harmony import */ var _community_js__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! ./community.js */ "./node_modules/ethers/lib.esm/providers/community.js");
/* harmony import */ var _network_js__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ./network.js */ "./node_modules/ethers/lib.esm/providers/network.js");
/* harmony import */ var _provider_jsonrpc_js__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./provider-jsonrpc.js */ "./node_modules/ethers/lib.esm/providers/provider-jsonrpc.js");
/* harmony import */ var _provider_websocket_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./provider-websocket.js */ "./node_modules/ethers/lib.esm/providers/provider-websocket.js");
/**
 *  [[link-infura]] provides a third-party service for connecting to
 *  various blockchains over JSON-RPC.
 *
 *  **Supported Networks**
 *
 *  - Ethereum Mainnet (``mainnet``)
 *  - Goerli Testnet (``goerli``)
 *  - Sepolia Testnet (``sepolia``)
 *  - Arbitrum (``arbitrum``)
 *  - Arbitrum Goerli Testnet (``arbitrum-goerli``)
 *  - Optimism (``optimism``)
 *  - Optimism Goerli Testnet (``optimism-goerli``)
 *  - Polygon (``matic``)
 *  - Polygon Mumbai Testnet (``matic-mumbai``)
 *
 *  @_subsection: api/providers/thirdparty:INFURA  [providers-infura]
 */





const defaultProjectId = "84842078b09946638c03157f83405213";
function getHost(name) {
    switch (name) {
        case "mainnet":
            return "mainnet.infura.io";
        case "goerli":
            return "goerli.infura.io";
        case "sepolia":
            return "sepolia.infura.io";
        case "arbitrum":
            return "arbitrum-mainnet.infura.io";
        case "arbitrum-goerli":
            return "arbitrum-goerli.infura.io";
        case "matic":
            return "polygon-mainnet.infura.io";
        case "matic-mumbai":
            return "polygon-mumbai.infura.io";
        case "optimism":
            return "optimism-mainnet.infura.io";
        case "optimism-goerli":
            return "optimism-goerli.infura.io";
    }
    (0,_utils_index_js__WEBPACK_IMPORTED_MODULE_0__.assertArgument)(false, "unsupported network", "network", name);
}
/**
 *  The **InfuraWebSocketProvider** connects to the [[link-infura]]
 *  WebSocket end-points.
 *
 *  By default, a highly-throttled API key is used, which is
 *  appropriate for quick prototypes and simple scripts. To
 *  gain access to an increased rate-limit, it is highly
 *  recommended to [sign up here](link-infura-signup).
 */
class InfuraWebSocketProvider extends _provider_websocket_js__WEBPACK_IMPORTED_MODULE_1__.WebSocketProvider {
    /**
     *  The Project ID for the INFURA connection.
     */
    projectId;
    /**
     *  The Project Secret.
     *
     *  If null, no authenticated requests are made. This should not
     *  be used outside of private contexts.
     */
    projectSecret;
    /**
     *  Creates a new **InfuraWebSocketProvider**.
     */
    constructor(network, projectId) {
        const provider = new InfuraProvider(network, projectId);
        const req = provider._getConnection();
        (0,_utils_index_js__WEBPACK_IMPORTED_MODULE_0__.assert)(!req.credentials, "INFURA WebSocket project secrets unsupported", "UNSUPPORTED_OPERATION", { operation: "InfuraProvider.getWebSocketProvider()" });
        const url = req.url.replace(/^http/i, "ws").replace("/v3/", "/ws/v3/");
        super(url, network);
        (0,_utils_index_js__WEBPACK_IMPORTED_MODULE_2__.defineProperties)(this, {
            projectId: provider.projectId,
            projectSecret: provider.projectSecret
        });
    }
    isCommunityResource() {
        return (this.projectId === defaultProjectId);
    }
}
/**
 *  The **InfuraProvider** connects to the [[link-infura]]
 *  JSON-RPC end-points.
 *
 *  By default, a highly-throttled API key is used, which is
 *  appropriate for quick prototypes and simple scripts. To
 *  gain access to an increased rate-limit, it is highly
 *  recommended to [sign up here](link-infura-signup).
 */
class InfuraProvider extends _provider_jsonrpc_js__WEBPACK_IMPORTED_MODULE_3__.JsonRpcProvider {
    /**
     *  The Project ID for the INFURA connection.
     */
    projectId;
    /**
     *  The Project Secret.
     *
     *  If null, no authenticated requests are made. This should not
     *  be used outside of private contexts.
     */
    projectSecret;
    /**
     *  Creates a new **InfuraProvider**.
     */
    constructor(_network, projectId, projectSecret) {
        if (_network == null) {
            _network = "mainnet";
        }
        const network = _network_js__WEBPACK_IMPORTED_MODULE_4__.Network.from(_network);
        if (projectId == null) {
            projectId = defaultProjectId;
        }
        if (projectSecret == null) {
            projectSecret = null;
        }
        const request = InfuraProvider.getRequest(network, projectId, projectSecret);
        super(request, network, { staticNetwork: network });
        (0,_utils_index_js__WEBPACK_IMPORTED_MODULE_2__.defineProperties)(this, { projectId, projectSecret });
    }
    _getProvider(chainId) {
        try {
            return new InfuraProvider(chainId, this.projectId, this.projectSecret);
        }
        catch (error) { }
        return super._getProvider(chainId);
    }
    isCommunityResource() {
        return (this.projectId === defaultProjectId);
    }
    /**
     *  Creates a new **InfuraWebSocketProvider**.
     */
    static getWebSocketProvider(network, projectId) {
        return new InfuraWebSocketProvider(network, projectId);
    }
    /**
     *  Returns a prepared request for connecting to %%network%%
     *  with %%projectId%% and %%projectSecret%%.
     */
    static getRequest(network, projectId, projectSecret) {
        if (projectId == null) {
            projectId = defaultProjectId;
        }
        if (projectSecret == null) {
            projectSecret = null;
        }
        const request = new _utils_index_js__WEBPACK_IMPORTED_MODULE_5__.FetchRequest(`https:/\/${getHost(network.name)}/v3/${projectId}`);
        request.allowGzip = true;
        if (projectSecret) {
            request.setCredentials("", projectSecret);
        }
        if (projectId === defaultProjectId) {
            request.retryFunc = async (request, response, attempt) => {
                (0,_community_js__WEBPACK_IMPORTED_MODULE_6__.showThrottleMessage)("InfuraProvider");
                return true;
            };
        }
        return request;
    }
}
//# sourceMappingURL=provider-infura.js.map

/***/ }),

/***/ "./node_modules/ethers/lib.esm/providers/provider-jsonrpc.js":
/*!*******************************************************************!*\
  !*** ./node_modules/ethers/lib.esm/providers/provider-jsonrpc.js ***!
  \*******************************************************************/
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "JsonRpcApiPollingProvider": () => (/* binding */ JsonRpcApiPollingProvider),
/* harmony export */   "JsonRpcApiProvider": () => (/* binding */ JsonRpcApiProvider),
/* harmony export */   "JsonRpcProvider": () => (/* binding */ JsonRpcProvider),
/* harmony export */   "JsonRpcSigner": () => (/* binding */ JsonRpcSigner)
/* harmony export */ });
/* harmony import */ var _abi_index_js__WEBPACK_IMPORTED_MODULE_14__ = __webpack_require__(/*! ../abi/index.js */ "./node_modules/ethers/lib.esm/abi/abi-coder.js");
/* harmony import */ var _address_index_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../address/index.js */ "./node_modules/ethers/lib.esm/address/address.js");
/* harmony import */ var _address_index_js__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ../address/index.js */ "./node_modules/ethers/lib.esm/address/checks.js");
/* harmony import */ var _hash_index_js__WEBPACK_IMPORTED_MODULE_7__ = __webpack_require__(/*! ../hash/index.js */ "./node_modules/ethers/lib.esm/hash/typed-data.js");
/* harmony import */ var _transaction_index_js__WEBPACK_IMPORTED_MODULE_13__ = __webpack_require__(/*! ../transaction/index.js */ "./node_modules/ethers/lib.esm/transaction/accesslist.js");
/* harmony import */ var _utils_index_js__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ../utils/index.js */ "./node_modules/ethers/lib.esm/utils/properties.js");
/* harmony import */ var _utils_index_js__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ../utils/index.js */ "./node_modules/ethers/lib.esm/utils/errors.js");
/* harmony import */ var _utils_index_js__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! ../utils/index.js */ "./node_modules/ethers/lib.esm/utils/utf8.js");
/* harmony import */ var _utils_index_js__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! ../utils/index.js */ "./node_modules/ethers/lib.esm/utils/data.js");
/* harmony import */ var _utils_index_js__WEBPACK_IMPORTED_MODULE_9__ = __webpack_require__(/*! ../utils/index.js */ "./node_modules/ethers/lib.esm/utils/maths.js");
/* harmony import */ var _utils_index_js__WEBPACK_IMPORTED_MODULE_15__ = __webpack_require__(/*! ../utils/index.js */ "./node_modules/ethers/lib.esm/utils/fetch.js");
/* harmony import */ var _abstract_provider_js__WEBPACK_IMPORTED_MODULE_8__ = __webpack_require__(/*! ./abstract-provider.js */ "./node_modules/ethers/lib.esm/providers/abstract-provider.js");
/* harmony import */ var _abstract_signer_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./abstract-signer.js */ "./node_modules/ethers/lib.esm/providers/abstract-signer.js");
/* harmony import */ var _network_js__WEBPACK_IMPORTED_MODULE_10__ = __webpack_require__(/*! ./network.js */ "./node_modules/ethers/lib.esm/providers/network.js");
/* harmony import */ var _subscriber_filterid_js__WEBPACK_IMPORTED_MODULE_11__ = __webpack_require__(/*! ./subscriber-filterid.js */ "./node_modules/ethers/lib.esm/providers/subscriber-filterid.js");
/* harmony import */ var _subscriber_polling_js__WEBPACK_IMPORTED_MODULE_12__ = __webpack_require__(/*! ./subscriber-polling.js */ "./node_modules/ethers/lib.esm/providers/subscriber-polling.js");
/**
 *  About JSON-RPC...
 *
 * @_section: api/providers/jsonrpc:JSON-RPC Provider  [about-jsonrpcProvider]
 */
// @TODO:
// - Add the batching API
// https://playground.open-rpc.org/?schemaUrl=https://raw.githubusercontent.com/ethereum/eth1.0-apis/assembled-spec/openrpc.json&uiSchema%5BappBar%5D%5Bui:splitView%5D=true&uiSchema%5BappBar%5D%5Bui:input%5D=false&uiSchema%5BappBar%5D%5Bui:examplesDropdown%5D=false










const Primitive = "bigint,boolean,function,number,string,symbol".split(/,/g);
//const Methods = "getAddress,then".split(/,/g);
function deepCopy(value) {
    if (value == null || Primitive.indexOf(typeof (value)) >= 0) {
        return value;
    }
    // Keep any Addressable
    if (typeof (value.getAddress) === "function") {
        return value;
    }
    if (Array.isArray(value)) {
        return (value.map(deepCopy));
    }
    if (typeof (value) === "object") {
        return Object.keys(value).reduce((accum, key) => {
            accum[key] = value[key];
            return accum;
        }, {});
    }
    throw new Error(`should not happen: ${value} (${typeof (value)})`);
}
function stall(duration) {
    return new Promise((resolve) => { setTimeout(resolve, duration); });
}
function getLowerCase(value) {
    if (value) {
        return value.toLowerCase();
    }
    return value;
}
function isPollable(value) {
    return (value && typeof (value.pollingInterval) === "number");
}
const defaultOptions = {
    polling: false,
    staticNetwork: null,
    batchStallTime: 10,
    batchMaxSize: (1 << 20),
    batchMaxCount: 100 // 100 requests
};
// @TODO: Unchecked Signers
class JsonRpcSigner extends _abstract_signer_js__WEBPACK_IMPORTED_MODULE_0__.AbstractSigner {
    address;
    constructor(provider, address) {
        super(provider);
        address = (0,_address_index_js__WEBPACK_IMPORTED_MODULE_1__.getAddress)(address);
        (0,_utils_index_js__WEBPACK_IMPORTED_MODULE_2__.defineProperties)(this, { address });
    }
    connect(provider) {
        (0,_utils_index_js__WEBPACK_IMPORTED_MODULE_3__.assert)(false, "cannot reconnect JsonRpcSigner", "UNSUPPORTED_OPERATION", {
            operation: "signer.connect"
        });
    }
    async getAddress() {
        return this.address;
    }
    // JSON-RPC will automatially fill in nonce, etc. so we just check from
    async populateTransaction(tx) {
        return await this.populateCall(tx);
    }
    // Returns just the hash of the transaction after sent, which is what
    // the bare JSON-RPC API does;
    async sendUncheckedTransaction(_tx) {
        const tx = deepCopy(_tx);
        const promises = [];
        // Make sure the from matches the sender
        if (tx.from) {
            const _from = tx.from;
            promises.push((async () => {
                const from = await (0,_address_index_js__WEBPACK_IMPORTED_MODULE_4__.resolveAddress)(_from, this.provider);
                (0,_utils_index_js__WEBPACK_IMPORTED_MODULE_3__.assertArgument)(from != null && from.toLowerCase() === this.address.toLowerCase(), "from address mismatch", "transaction", _tx);
                tx.from = from;
            })());
        }
        else {
            tx.from = this.address;
        }
        // The JSON-RPC for eth_sendTransaction uses 90000 gas; if the user
        // wishes to use this, it is easy to specify explicitly, otherwise
        // we look it up for them.
        if (tx.gasLimit == null) {
            promises.push((async () => {
                tx.gasLimit = await this.provider.estimateGas({ ...tx, from: this.address });
            })());
        }
        // The address may be an ENS name or Addressable
        if (tx.to != null) {
            const _to = tx.to;
            promises.push((async () => {
                tx.to = await (0,_address_index_js__WEBPACK_IMPORTED_MODULE_4__.resolveAddress)(_to, this.provider);
            })());
        }
        // Wait until all of our properties are filled in
        if (promises.length) {
            await Promise.all(promises);
        }
        const hexTx = this.provider.getRpcTransaction(tx);
        return this.provider.send("eth_sendTransaction", [hexTx]);
    }
    async sendTransaction(tx) {
        // This cannot be mined any earlier than any recent block
        const blockNumber = await this.provider.getBlockNumber();
        // Send the transaction
        const hash = await this.sendUncheckedTransaction(tx);
        // Unfortunately, JSON-RPC only provides and opaque transaction hash
        // for a response, and we need the actual transaction, so we poll
        // for it; it should show up very quickly
        return await (new Promise((resolve, reject) => {
            const timeouts = [1000, 100];
            const checkTx = async () => {
                // Try getting the transaction
                const tx = await this.provider.getTransaction(hash);
                if (tx != null) {
                    resolve(tx.replaceableTransaction(blockNumber));
                    return;
                }
                // Wait another 4 seconds
                this.provider._setTimeout(() => { checkTx(); }, timeouts.pop() || 4000);
            };
            checkTx();
        }));
    }
    async signTransaction(_tx) {
        const tx = deepCopy(_tx);
        // Make sure the from matches the sender
        if (tx.from) {
            const from = await (0,_address_index_js__WEBPACK_IMPORTED_MODULE_4__.resolveAddress)(tx.from, this.provider);
            (0,_utils_index_js__WEBPACK_IMPORTED_MODULE_3__.assertArgument)(from != null && from.toLowerCase() === this.address.toLowerCase(), "from address mismatch", "transaction", _tx);
            tx.from = from;
        }
        else {
            tx.from = this.address;
        }
        const hexTx = this.provider.getRpcTransaction(tx);
        return await this.provider.send("eth_signTransaction", [hexTx]);
    }
    async signMessage(_message) {
        const message = ((typeof (_message) === "string") ? (0,_utils_index_js__WEBPACK_IMPORTED_MODULE_5__.toUtf8Bytes)(_message) : _message);
        return await this.provider.send("personal_sign", [
            (0,_utils_index_js__WEBPACK_IMPORTED_MODULE_6__.hexlify)(message), this.address.toLowerCase()
        ]);
    }
    async signTypedData(domain, types, _value) {
        const value = deepCopy(_value);
        // Populate any ENS names (in-place)
        const populated = await _hash_index_js__WEBPACK_IMPORTED_MODULE_7__.TypedDataEncoder.resolveNames(domain, types, value, async (value) => {
            const address = await (0,_address_index_js__WEBPACK_IMPORTED_MODULE_4__.resolveAddress)(value);
            (0,_utils_index_js__WEBPACK_IMPORTED_MODULE_3__.assertArgument)(address != null, "TypedData does not support null address", "value", value);
            return address;
        });
        return await this.provider.send("eth_signTypedData_v4", [
            this.address.toLowerCase(),
            JSON.stringify(_hash_index_js__WEBPACK_IMPORTED_MODULE_7__.TypedDataEncoder.getPayload(populated.domain, types, populated.value))
        ]);
    }
    async unlock(password) {
        return this.provider.send("personal_unlockAccount", [
            this.address.toLowerCase(), password, null
        ]);
    }
    // https://github.com/ethereum/wiki/wiki/JSON-RPC#eth_sign
    async _legacySignMessage(_message) {
        const message = ((typeof (_message) === "string") ? (0,_utils_index_js__WEBPACK_IMPORTED_MODULE_5__.toUtf8Bytes)(_message) : _message);
        return await this.provider.send("eth_sign", [
            this.address.toLowerCase(), (0,_utils_index_js__WEBPACK_IMPORTED_MODULE_6__.hexlify)(message)
        ]);
    }
}
/**
 *  The JsonRpcApiProvider is an abstract class and **MUST** be
 *  sub-classed.
 *
 *  It provides the base for all JSON-RPC-based Provider interaction.
 *
 *  Sub-classing Notes:
 *  - a sub-class MUST override _send
 *  - a sub-class MUST call the `_start()` method once connected
 */
class JsonRpcApiProvider extends _abstract_provider_js__WEBPACK_IMPORTED_MODULE_8__.AbstractProvider {
    #options;
    // The next ID to use for the JSON-RPC ID field
    #nextId;
    // Payloads are queued and triggered in batches using the drainTimer
    #payloads;
    #drainTimer;
    #notReady;
    #network;
    #scheduleDrain() {
        if (this.#drainTimer) {
            return;
        }
        // If we aren't using batching, no hard in sending it immeidately
        const stallTime = (this._getOption("batchMaxCount") === 1) ? 0 : this._getOption("batchStallTime");
        this.#drainTimer = setTimeout(() => {
            this.#drainTimer = null;
            const payloads = this.#payloads;
            this.#payloads = [];
            while (payloads.length) {
                // Create payload batches that satisfy our batch constraints
                const batch = [(payloads.shift())];
                while (payloads.length) {
                    if (batch.length === this.#options.batchMaxCount) {
                        break;
                    }
                    batch.push((payloads.shift()));
                    const bytes = JSON.stringify(batch.map((p) => p.payload));
                    if (bytes.length > this.#options.batchMaxSize) {
                        payloads.unshift((batch.pop()));
                        break;
                    }
                }
                // Process the result to each payload
                (async () => {
                    const payload = ((batch.length === 1) ? batch[0].payload : batch.map((p) => p.payload));
                    this.emit("debug", { action: "sendRpcPayload", payload });
                    try {
                        const result = await this._send(payload);
                        this.emit("debug", { action: "receiveRpcResult", result });
                        // Process results in batch order
                        for (const { resolve, reject, payload } of batch) {
                            // Find the matching result
                            const resp = result.filter((r) => (r.id === payload.id))[0];
                            // No result; the node failed us in unexpected ways
                            if (resp == null) {
                                return reject(new Error("@TODO: no result"));
                            }
                            // The response is an error
                            if ("error" in resp) {
                                return reject(this.getRpcError(payload, resp));
                            }
                            // All good; send the result
                            resolve(resp.result);
                        }
                    }
                    catch (error) {
                        this.emit("debug", { action: "receiveRpcError", error });
                        for (const { reject } of batch) {
                            // @TODO: augment the error with the payload
                            reject(error);
                        }
                    }
                })();
            }
        }, stallTime);
    }
    constructor(network, options) {
        super(network);
        this.#nextId = 1;
        this.#options = Object.assign({}, defaultOptions, options || {});
        this.#payloads = [];
        this.#drainTimer = null;
        this.#network = null;
        {
            let resolve = null;
            const promise = new Promise((_resolve) => {
                resolve = _resolve;
            });
            this.#notReady = { promise, resolve };
        }
        // This could be relaxed in the future to just check equivalent networks
        const staticNetwork = this._getOption("staticNetwork");
        if (staticNetwork) {
            (0,_utils_index_js__WEBPACK_IMPORTED_MODULE_3__.assertArgument)(staticNetwork === network, "staticNetwork MUST match network object", "options", options);
            this.#network = staticNetwork;
        }
    }
    /**
     *  Returns the value associated with the option %%key%%.
     *
     *  Sub-classes can use this to inquire about configuration options.
     */
    _getOption(key) {
        return this.#options[key];
    }
    /**
     *  Gets the [[Network]] this provider has committed to. On each call, the network
     *  is detected, and if it has changed, the call will reject.
     */
    get _network() {
        (0,_utils_index_js__WEBPACK_IMPORTED_MODULE_3__.assert)(this.#network, "network is not available yet", "NETWORK_ERROR");
        return this.#network;
    }
    /*
     {
        assert(false, "sub-classes must override _send", "UNSUPPORTED_OPERATION", {
            operation: "jsonRpcApiProvider._send"
        });
    }
    */
    /**
     *  Resolves to the non-normalized value by performing %%req%%.
     *
     *  Sub-classes may override this to modify behavior of actions,
     *  and should generally call ``super._perform`` as a fallback.
     */
    async _perform(req) {
        // Legacy networks do not like the type field being passed along (which
        // is fair), so we delete type if it is 0 and a non-EIP-1559 network
        if (req.method === "call" || req.method === "estimateGas") {
            let tx = req.transaction;
            if (tx && tx.type != null && (0,_utils_index_js__WEBPACK_IMPORTED_MODULE_9__.getBigInt)(tx.type)) {
                // If there are no EIP-1559 properties, it might be non-EIP-a559
                if (tx.maxFeePerGas == null && tx.maxPriorityFeePerGas == null) {
                    const feeData = await this.getFeeData();
                    if (feeData.maxFeePerGas == null && feeData.maxPriorityFeePerGas == null) {
                        // Network doesn't know about EIP-1559 (and hence type)
                        req = Object.assign({}, req, {
                            transaction: Object.assign({}, tx, { type: undefined })
                        });
                    }
                }
            }
        }
        const request = this.getRpcRequest(req);
        if (request != null) {
            return await this.send(request.method, request.args);
        }
        return super._perform(req);
    }
    /**
     *  Sub-classes may override this; it detects the *actual* network that
     *  we are **currently** connected to.
     *
     *  Keep in mind that [[send]] may only be used once [[ready]], otherwise the
     *  _send primitive must be used instead.
     */
    async _detectNetwork() {
        const network = this._getOption("staticNetwork");
        if (network) {
            return network;
        }
        // If we are ready, use ``send``, which enabled requests to be batched
        if (this.ready) {
            return _network_js__WEBPACK_IMPORTED_MODULE_10__.Network.from((0,_utils_index_js__WEBPACK_IMPORTED_MODULE_9__.getBigInt)(await this.send("eth_chainId", [])));
        }
        // We are not ready yet; use the primitive _send
        const payload = {
            id: this.#nextId++, method: "eth_chainId", params: [], jsonrpc: "2.0"
        };
        this.emit("debug", { action: "sendRpcPayload", payload });
        let result;
        try {
            result = (await this._send(payload))[0];
        }
        catch (error) {
            this.emit("debug", { action: "receiveRpcError", error });
            throw error;
        }
        this.emit("debug", { action: "receiveRpcResult", result });
        if ("result" in result) {
            return _network_js__WEBPACK_IMPORTED_MODULE_10__.Network.from((0,_utils_index_js__WEBPACK_IMPORTED_MODULE_9__.getBigInt)(result.result));
        }
        throw this.getRpcError(payload, result);
    }
    /**
     *  Sub-classes **MUST** call this. Until [[_start]] has been called, no calls
     *  will be passed to [[_send]] from [[send]]. If it is overridden, then
     *  ``super._start()`` **MUST** be called.
     *
     *  Calling it multiple times is safe and has no effect.
     */
    _start() {
        if (this.#notReady == null || this.#notReady.resolve == null) {
            return;
        }
        this.#notReady.resolve();
        this.#notReady = null;
        (async () => {
            // Bootstrap the network
            while (this.#network == null) {
                try {
                    this.#network = await this._detectNetwork();
                }
                catch (error) {
                    console.log("JsonRpcProvider failed to startup; retry in 1s");
                    await stall(1000);
                }
            }
            // Start dispatching requests
            this.#scheduleDrain();
        })();
    }
    /**
     *  Resolves once the [[_start]] has been called. This can be used in
     *  sub-classes to defer sending data until the connection has been
     *  established.
     */
    async _waitUntilReady() {
        if (this.#notReady == null) {
            return;
        }
        return await this.#notReady.promise;
    }
    /**
     *  Return a Subscriber that will manage the %%sub%%.
     *
     *  Sub-classes may override this to modify the behavior of
     *  subscription management.
     */
    _getSubscriber(sub) {
        // Pending Filters aren't availble via polling
        if (sub.type === "pending") {
            return new _subscriber_filterid_js__WEBPACK_IMPORTED_MODULE_11__.FilterIdPendingSubscriber(this);
        }
        if (sub.type === "event") {
            if (this._getOption("polling")) {
                return new _subscriber_polling_js__WEBPACK_IMPORTED_MODULE_12__.PollingEventSubscriber(this, sub.filter);
            }
            return new _subscriber_filterid_js__WEBPACK_IMPORTED_MODULE_11__.FilterIdEventSubscriber(this, sub.filter);
        }
        // Orphaned Logs are handled automatically, by the filter, since
        // logs with removed are emitted by it
        if (sub.type === "orphan" && sub.filter.orphan === "drop-log") {
            return new _abstract_provider_js__WEBPACK_IMPORTED_MODULE_8__.UnmanagedSubscriber("orphan");
        }
        return super._getSubscriber(sub);
    }
    /**
     *  Returns true only if the [[_start]] has been called.
     */
    get ready() { return this.#notReady == null; }
    /**
     *  Returns %%tx%% as a normalized JSON-RPC transaction request,
     *  which has all values hexlified and any numeric values converted
     *  to Quantity values.
     */
    getRpcTransaction(tx) {
        const result = {};
        // JSON-RPC now requires numeric values to be "quantity" values
        ["chainId", "gasLimit", "gasPrice", "type", "maxFeePerGas", "maxPriorityFeePerGas", "nonce", "value"].forEach((key) => {
            if (tx[key] == null) {
                return;
            }
            let dstKey = key;
            if (key === "gasLimit") {
                dstKey = "gas";
            }
            result[dstKey] = (0,_utils_index_js__WEBPACK_IMPORTED_MODULE_9__.toQuantity)((0,_utils_index_js__WEBPACK_IMPORTED_MODULE_9__.getBigInt)(tx[key], `tx.${key}`));
        });
        // Make sure addresses and data are lowercase
        ["from", "to", "data"].forEach((key) => {
            if (tx[key] == null) {
                return;
            }
            result[key] = (0,_utils_index_js__WEBPACK_IMPORTED_MODULE_6__.hexlify)(tx[key]);
        });
        // Normalize the access list object
        if (tx.accessList) {
            result["accessList"] = (0,_transaction_index_js__WEBPACK_IMPORTED_MODULE_13__.accessListify)(tx.accessList);
        }
        return result;
    }
    /**
     *  Returns the request method and arguments required to perform
     *  %%req%%.
     */
    getRpcRequest(req) {
        switch (req.method) {
            case "chainId":
                return { method: "eth_chainId", args: [] };
            case "getBlockNumber":
                return { method: "eth_blockNumber", args: [] };
            case "getGasPrice":
                return { method: "eth_gasPrice", args: [] };
            case "getBalance":
                return {
                    method: "eth_getBalance",
                    args: [getLowerCase(req.address), req.blockTag]
                };
            case "getTransactionCount":
                return {
                    method: "eth_getTransactionCount",
                    args: [getLowerCase(req.address), req.blockTag]
                };
            case "getCode":
                return {
                    method: "eth_getCode",
                    args: [getLowerCase(req.address), req.blockTag]
                };
            case "getStorage":
                return {
                    method: "eth_getStorageAt",
                    args: [
                        getLowerCase(req.address),
                        ("0x" + req.position.toString(16)),
                        req.blockTag
                    ]
                };
            case "broadcastTransaction":
                return {
                    method: "eth_sendRawTransaction",
                    args: [req.signedTransaction]
                };
            case "getBlock":
                if ("blockTag" in req) {
                    return {
                        method: "eth_getBlockByNumber",
                        args: [req.blockTag, !!req.includeTransactions]
                    };
                }
                else if ("blockHash" in req) {
                    return {
                        method: "eth_getBlockByHash",
                        args: [req.blockHash, !!req.includeTransactions]
                    };
                }
                break;
            case "getTransaction":
                return {
                    method: "eth_getTransactionByHash",
                    args: [req.hash]
                };
            case "getTransactionReceipt":
                return {
                    method: "eth_getTransactionReceipt",
                    args: [req.hash]
                };
            case "call":
                return {
                    method: "eth_call",
                    args: [this.getRpcTransaction(req.transaction), req.blockTag]
                };
            case "estimateGas": {
                return {
                    method: "eth_estimateGas",
                    args: [this.getRpcTransaction(req.transaction)]
                };
            }
            case "getLogs":
                if (req.filter && req.filter.address != null) {
                    if (Array.isArray(req.filter.address)) {
                        req.filter.address = req.filter.address.map(getLowerCase);
                    }
                    else {
                        req.filter.address = getLowerCase(req.filter.address);
                    }
                }
                return { method: "eth_getLogs", args: [req.filter] };
        }
        return null;
    }
    /**
     *  Returns an ethers-style Error for the given JSON-RPC error
     *  %%payload%%, coalescing the various strings and error shapes
     *  that different nodes return, coercing them into a machine-readable
     *  standardized error.
     */
    getRpcError(payload, _error) {
        const { method } = payload;
        const { error } = _error;
        if (method === "eth_estimateGas" && error.message) {
            const msg = error.message;
            if (!msg.match(/revert/i) && msg.match(/insufficient funds/i)) {
                return (0,_utils_index_js__WEBPACK_IMPORTED_MODULE_3__.makeError)("insufficient funds", "INSUFFICIENT_FUNDS", {
                    transaction: (payload.params[0]),
                });
            }
        }
        if (method === "eth_call" || method === "eth_estimateGas") {
            const result = spelunkData(error);
            const e = _abi_index_js__WEBPACK_IMPORTED_MODULE_14__.AbiCoder.getBuiltinCallException((method === "eth_call") ? "call" : "estimateGas", (payload.params[0]), (result ? result.data : null));
            e.info = { error, payload };
            return e;
        }
        // Only estimateGas and call can return arbitrary contract-defined text, so now we
        // we can process text safely.
        const message = JSON.stringify(spelunkMessage(error));
        if (typeof (error.message) === "string" && error.message.match(/user denied|ethers-user-denied/i)) {
            const actionMap = {
                eth_sign: "signMessage",
                personal_sign: "signMessage",
                eth_signTypedData_v4: "signTypedData",
                eth_signTransaction: "signTransaction",
                eth_sendTransaction: "sendTransaction",
                eth_requestAccounts: "requestAccess",
                wallet_requestAccounts: "requestAccess",
            };
            return (0,_utils_index_js__WEBPACK_IMPORTED_MODULE_3__.makeError)(`user rejected action`, "ACTION_REJECTED", {
                action: (actionMap[method] || "unknown"),
                reason: "rejected",
                info: { payload, error }
            });
        }
        if (method === "eth_sendRawTransaction" || method === "eth_sendTransaction") {
            const transaction = (payload.params[0]);
            if (message.match(/insufficient funds|base fee exceeds gas limit/i)) {
                return (0,_utils_index_js__WEBPACK_IMPORTED_MODULE_3__.makeError)("insufficient funds for intrinsic transaction cost", "INSUFFICIENT_FUNDS", {
                    transaction, info: { error }
                });
            }
            if (message.match(/nonce/i) && message.match(/too low/i)) {
                return (0,_utils_index_js__WEBPACK_IMPORTED_MODULE_3__.makeError)("nonce has already been used", "NONCE_EXPIRED", { transaction });
            }
            // "replacement transaction underpriced"
            if (message.match(/replacement transaction/i) && message.match(/underpriced/i)) {
                return (0,_utils_index_js__WEBPACK_IMPORTED_MODULE_3__.makeError)("replacement fee too low", "REPLACEMENT_UNDERPRICED", { transaction });
            }
            if (message.match(/only replay-protected/i)) {
                return (0,_utils_index_js__WEBPACK_IMPORTED_MODULE_3__.makeError)("legacy pre-eip-155 transactions not supported", "UNSUPPORTED_OPERATION", {
                    operation: method, info: { transaction }
                });
            }
        }
        if (message.match(/the method .* does not exist/i)) {
            return (0,_utils_index_js__WEBPACK_IMPORTED_MODULE_3__.makeError)("unsupported operation", "UNSUPPORTED_OPERATION", {
                operation: payload.method, info: { error }
            });
        }
        return (0,_utils_index_js__WEBPACK_IMPORTED_MODULE_3__.makeError)("could not coalesce error", "UNKNOWN_ERROR", { error });
    }
    /**
     *  Requests the %%method%% with %%params%% via the JSON-RPC protocol
     *  over the underlying channel. This can be used to call methods
     *  on the backend that do not have a high-level API within the Provider
     *  API.
     *
     *  This method queues requests according to the batch constraints
     *  in the options, assigns the request a unique ID.
     *
     *  **Do NOT override** this method in sub-classes; instead
     *  override [[_send]] or force the options values in the
     *  call to the constructor to modify this method's behavior.
     */
    send(method, params) {
        // @TODO: cache chainId?? purge on switch_networks
        const id = this.#nextId++;
        const promise = new Promise((resolve, reject) => {
            this.#payloads.push({
                resolve, reject,
                payload: { method, params, id, jsonrpc: "2.0" }
            });
        });
        // If there is not a pending drainTimer, set one
        this.#scheduleDrain();
        return promise;
    }
    /**
     *  Resolves to the [[Signer]] account for  %%address%% managed by
     *  the client.
     *
     *  If the %%address%% is a number, it is used as an index in the
     *  the accounts from [[listAccounts]].
     *
     *  This can only be used on clients which manage accounts (such as
     *  Geth with imported account or MetaMask).
     *
     *  Throws if the account doesn't exist.
     */
    async getSigner(address) {
        if (address == null) {
            address = 0;
        }
        const accountsPromise = this.send("eth_accounts", []);
        // Account index
        if (typeof (address) === "number") {
            const accounts = (await accountsPromise);
            if (address >= accounts.length) {
                throw new Error("no such account");
            }
            return new JsonRpcSigner(this, accounts[address]);
        }
        const { accounts } = await (0,_utils_index_js__WEBPACK_IMPORTED_MODULE_2__.resolveProperties)({
            network: this.getNetwork(),
            accounts: accountsPromise
        });
        // Account address
        address = (0,_address_index_js__WEBPACK_IMPORTED_MODULE_1__.getAddress)(address);
        for (const account of accounts) {
            if ((0,_address_index_js__WEBPACK_IMPORTED_MODULE_1__.getAddress)(account) === address) {
                return new JsonRpcSigner(this, address);
            }
        }
        throw new Error("invalid account");
    }
}
class JsonRpcApiPollingProvider extends JsonRpcApiProvider {
    #pollingInterval;
    constructor(network, options) {
        super(network, options);
        this.#pollingInterval = 4000;
    }
    _getSubscriber(sub) {
        const subscriber = super._getSubscriber(sub);
        if (isPollable(subscriber)) {
            subscriber.pollingInterval = this.#pollingInterval;
        }
        return subscriber;
    }
    /**
     *  The polling interval (default: 4000 ms)
     */
    get pollingInterval() { return this.#pollingInterval; }
    set pollingInterval(value) {
        if (!Number.isInteger(value) || value < 0) {
            throw new Error("invalid interval");
        }
        this.#pollingInterval = value;
        this._forEachSubscriber((sub) => {
            if (isPollable(sub)) {
                sub.pollingInterval = this.#pollingInterval;
            }
        });
    }
}
/**
 *  The JsonRpcProvider is one of the most common Providers,
 *  which performs all operations over HTTP (or HTTPS) requests.
 *
 *  Events are processed by polling the backend for the current block
 *  number; when it advances, all block-base events are then checked
 *  for updates.
 */
class JsonRpcProvider extends JsonRpcApiPollingProvider {
    #connect;
    constructor(url, network, options) {
        if (url == null) {
            url = "http:/\/localhost:8545";
        }
        super(network, options);
        if (typeof (url) === "string") {
            this.#connect = new _utils_index_js__WEBPACK_IMPORTED_MODULE_15__.FetchRequest(url);
        }
        else {
            this.#connect = url.clone();
        }
    }
    _getConnection() {
        return this.#connect.clone();
    }
    async send(method, params) {
        // All requests are over HTTP, so we can just start handling requests
        // We do this here rather than the constructor so that we don't send any
        // requests to the network (i.e. eth_chainId) until we absolutely have to.
        await this._start();
        return await super.send(method, params);
    }
    async _send(payload) {
        // Configure a POST connection for the requested method
        const request = this._getConnection();
        request.body = JSON.stringify(payload);
        request.setHeader("content-type", "application/json");
        const response = await request.send();
        response.assertOk();
        let resp = response.bodyJson;
        if (!Array.isArray(resp)) {
            resp = [resp];
        }
        return resp;
    }
}
function spelunkData(value) {
    if (value == null) {
        return null;
    }
    // These *are* the droids we're looking for.
    if (typeof (value.message) === "string" && value.message.match("reverted") && (0,_utils_index_js__WEBPACK_IMPORTED_MODULE_6__.isHexString)(value.data)) {
        return { message: value.message, data: value.data };
    }
    // Spelunk further...
    if (typeof (value) === "object") {
        for (const key in value) {
            const result = spelunkData(value[key]);
            if (result) {
                return result;
            }
        }
        return null;
    }
    // Might be a JSON string we can further descend...
    if (typeof (value) === "string") {
        try {
            return spelunkData(JSON.parse(value));
        }
        catch (error) { }
    }
    return null;
}
function _spelunkMessage(value, result) {
    if (value == null) {
        return;
    }
    // These *are* the droids we're looking for.
    if (typeof (value.message) === "string") {
        result.push(value.message);
    }
    // Spelunk further...
    if (typeof (value) === "object") {
        for (const key in value) {
            _spelunkMessage(value[key], result);
        }
    }
    // Might be a JSON string we can further descend...
    if (typeof (value) === "string") {
        try {
            return _spelunkMessage(JSON.parse(value), result);
        }
        catch (error) { }
    }
}
function spelunkMessage(value) {
    const result = [];
    _spelunkMessage(value, result);
    return result;
}
//# sourceMappingURL=provider-jsonrpc.js.map

/***/ }),

/***/ "./node_modules/ethers/lib.esm/providers/provider-quicknode.js":
/*!*********************************************************************!*\
  !*** ./node_modules/ethers/lib.esm/providers/provider-quicknode.js ***!
  \*********************************************************************/
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "QuickNodeProvider": () => (/* binding */ QuickNodeProvider)
/* harmony export */ });
/* harmony import */ var _utils_index_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../utils/index.js */ "./node_modules/ethers/lib.esm/utils/errors.js");
/* harmony import */ var _utils_index_js__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ../utils/index.js */ "./node_modules/ethers/lib.esm/utils/properties.js");
/* harmony import */ var _utils_index_js__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ../utils/index.js */ "./node_modules/ethers/lib.esm/utils/fetch.js");
/* harmony import */ var _community_js__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! ./community.js */ "./node_modules/ethers/lib.esm/providers/community.js");
/* harmony import */ var _network_js__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./network.js */ "./node_modules/ethers/lib.esm/providers/network.js");
/* harmony import */ var _provider_jsonrpc_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./provider-jsonrpc.js */ "./node_modules/ethers/lib.esm/providers/provider-jsonrpc.js");
/**
 *  [[link-quicknode]] provides a third-party service for connecting to
 *  various blockchains over JSON-RPC.
 *
 *  **Supported Networks**
 *
 *  - Ethereum Mainnet (``mainnet``)
 *  - Goerli Testnet (``goerli``)
 *  - Arbitrum (``arbitrum``)
 *  - Arbitrum Goerli Testnet (``arbitrum-goerli``)
 *  - Optimism (``optimism``)
 *  - Optimism Goerli Testnet (``optimism-goerli``)
 *  - Polygon (``matic``)
 *  - Polygon Mumbai Testnet (``matic-mumbai``)
 *
 *  @_subsection: api/providers/thirdparty:QuickNode  [providers-quicknode]
 */




const defaultToken = "919b412a057b5e9c9b6dce193c5a60242d6efadb";
function getHost(name) {
    switch (name) {
        case "mainnet":
            return "ethers.quiknode.pro";
        case "goerli":
            return "ethers.ethereum-goerli.quiknode.pro";
        //case "sepolia":
        //    return "sepolia.infura.io";
        case "arbitrum":
            return "ethers.arbitrum-mainnet.quiknode.pro";
        case "arbitrum-goerli":
            return "ethers.arbitrum-goerli.quiknode.pro";
        case "matic":
            return "ethers.matic.quiknode.pro";
        case "matic-mumbai":
            return "ethers.matic-testnet.quiknode.pro";
        case "optimism":
            return "ethers.optimism.quiknode.pro";
        case "optimism-goerli":
            return "ethers.optimism-goerli.quiknode.pro";
    }
    (0,_utils_index_js__WEBPACK_IMPORTED_MODULE_0__.assertArgument)(false, "unsupported network", "network", name);
}
/**
 *  The **QuickNodeProvider** connects to the [[link-quicknode]]
 *  JSON-RPC end-points.
 *
 *  By default, a highly-throttled API token is used, which is
 *  appropriate for quick prototypes and simple scripts. To
 *  gain access to an increased rate-limit, it is highly
 *  recommended to [sign up here](link-quicknode).
 */
class QuickNodeProvider extends _provider_jsonrpc_js__WEBPACK_IMPORTED_MODULE_1__.JsonRpcProvider {
    /**
     *  The API token.
     */
    token;
    /**
     *  Creates a new **QuickNodeProvider**.
     */
    constructor(_network, token) {
        if (_network == null) {
            _network = "mainnet";
        }
        const network = _network_js__WEBPACK_IMPORTED_MODULE_2__.Network.from(_network);
        if (token == null) {
            token = defaultToken;
        }
        const request = QuickNodeProvider.getRequest(network, token);
        super(request, network, { staticNetwork: network });
        (0,_utils_index_js__WEBPACK_IMPORTED_MODULE_3__.defineProperties)(this, { token });
    }
    _getProvider(chainId) {
        try {
            return new QuickNodeProvider(chainId, this.token);
        }
        catch (error) { }
        return super._getProvider(chainId);
    }
    isCommunityResource() {
        return (this.token === defaultToken);
    }
    /**
     *  Returns a new request prepared for %%network%% and the
     *  %%token%%.
     */
    static getRequest(network, token) {
        if (token == null) {
            token = defaultToken;
        }
        const request = new _utils_index_js__WEBPACK_IMPORTED_MODULE_4__.FetchRequest(`https:/\/${getHost(network.name)}/${token}`);
        request.allowGzip = true;
        //if (projectSecret) { request.setCredentials("", projectSecret); }
        if (token === defaultToken) {
            request.retryFunc = async (request, response, attempt) => {
                (0,_community_js__WEBPACK_IMPORTED_MODULE_5__.showThrottleMessage)("QuickNodeProvider");
                return true;
            };
        }
        return request;
    }
}
//# sourceMappingURL=provider-quicknode.js.map

/***/ }),

/***/ "./node_modules/ethers/lib.esm/providers/provider-socket.js":
/*!******************************************************************!*\
  !*** ./node_modules/ethers/lib.esm/providers/provider-socket.js ***!
  \******************************************************************/
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "SocketBlockSubscriber": () => (/* binding */ SocketBlockSubscriber),
/* harmony export */   "SocketEventSubscriber": () => (/* binding */ SocketEventSubscriber),
/* harmony export */   "SocketPendingSubscriber": () => (/* binding */ SocketPendingSubscriber),
/* harmony export */   "SocketProvider": () => (/* binding */ SocketProvider),
/* harmony export */   "SocketSubscriber": () => (/* binding */ SocketSubscriber)
/* harmony export */ });
/* harmony import */ var _abstract_provider_js__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./abstract-provider.js */ "./node_modules/ethers/lib.esm/providers/abstract-provider.js");
/* harmony import */ var _utils_index_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../utils/index.js */ "./node_modules/ethers/lib.esm/utils/errors.js");
/* harmony import */ var _provider_jsonrpc_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./provider-jsonrpc.js */ "./node_modules/ethers/lib.esm/providers/provider-jsonrpc.js");
/**
 *  Generic long-lived socket provider.
 *
 *  Sub-classing notes
 *  - a sub-class MUST call the `_start()` method once connected
 *  - a sub-class MUST override the `_write(string)` method
 *  - a sub-class MUST call `_processMessage(string)` for each message
 *
 *  @_subsection: api/providers/abstract-provider
 */



class SocketSubscriber {
    #provider;
    #filter;
    get filter() { return JSON.parse(this.#filter); }
    #filterId;
    #paused;
    #emitPromise;
    constructor(provider, filter) {
        this.#provider = provider;
        this.#filter = JSON.stringify(filter);
        this.#filterId = null;
        this.#paused = null;
        this.#emitPromise = null;
    }
    start() {
        this.#filterId = this.#provider.send("eth_subscribe", this.filter).then((filterId) => {
            ;
            this.#provider._register(filterId, this);
            return filterId;
        });
    }
    stop() {
        (this.#filterId).then((filterId) => {
            this.#provider.send("eth_unsubscribe", [filterId]);
        });
        this.#filterId = null;
    }
    // @TODO: pause should trap the current blockNumber, unsub, and on resume use getLogs
    //        and resume
    pause(dropWhilePaused) {
        (0,_utils_index_js__WEBPACK_IMPORTED_MODULE_0__.assert)(dropWhilePaused, "preserve logs while paused not supported by SocketSubscriber yet", "UNSUPPORTED_OPERATION", { operation: "pause(false)" });
        this.#paused = !!dropWhilePaused;
    }
    resume() {
        this.#paused = null;
    }
    _handleMessage(message) {
        if (this.#filterId == null) {
            return;
        }
        if (this.#paused === null) {
            let emitPromise = this.#emitPromise;
            if (emitPromise == null) {
                emitPromise = this._emit(this.#provider, message);
            }
            else {
                emitPromise = emitPromise.then(async () => {
                    await this._emit(this.#provider, message);
                });
            }
            this.#emitPromise = emitPromise.then(() => {
                if (this.#emitPromise === emitPromise) {
                    this.#emitPromise = null;
                }
            });
        }
    }
    async _emit(provider, message) {
        throw new Error("sub-classes must implemente this; _emit");
    }
}
class SocketBlockSubscriber extends SocketSubscriber {
    constructor(provider) {
        super(provider, ["newHeads"]);
    }
    async _emit(provider, message) {
        provider.emit("block", parseInt(message.number));
    }
}
class SocketPendingSubscriber extends SocketSubscriber {
    constructor(provider) {
        super(provider, ["newPendingTransactions"]);
    }
    async _emit(provider, message) {
        provider.emit("pending", message);
    }
}
class SocketEventSubscriber extends SocketSubscriber {
    #logFilter;
    get logFilter() { return JSON.parse(this.#logFilter); }
    constructor(provider, filter) {
        super(provider, ["logs", filter]);
        this.#logFilter = JSON.stringify(filter);
    }
    async _emit(provider, message) {
        provider.emit(this.#logFilter, provider._wrapLog(message, provider._network));
    }
}
/**
 *  SocketProvider...
 *
 */
class SocketProvider extends _provider_jsonrpc_js__WEBPACK_IMPORTED_MODULE_1__.JsonRpcApiProvider {
    #callbacks;
    // Maps each filterId to its subscriber
    #subs;
    // If any events come in before a subscriber has finished
    // registering, queue them
    #pending;
    constructor(network) {
        super(network, { batchMaxCount: 1 });
        this.#callbacks = new Map();
        this.#subs = new Map();
        this.#pending = new Map();
    }
    // This value is only valid after _start has been called
    /*
    get _network(): Network {
        if (this.#network == null) {
            throw new Error("this shouldn't happen");
        }
        return this.#network.clone();
    }
    */
    _getSubscriber(sub) {
        switch (sub.type) {
            case "close":
                return new _abstract_provider_js__WEBPACK_IMPORTED_MODULE_2__.UnmanagedSubscriber("close");
            case "block":
                return new SocketBlockSubscriber(this);
            case "pending":
                return new SocketPendingSubscriber(this);
            case "event":
                return new SocketEventSubscriber(this, sub.filter);
            case "orphan":
                // Handled auto-matically within AbstractProvider
                // when the log.removed = true
                if (sub.filter.orphan === "drop-log") {
                    return new _abstract_provider_js__WEBPACK_IMPORTED_MODULE_2__.UnmanagedSubscriber("drop-log");
                }
        }
        return super._getSubscriber(sub);
    }
    _register(filterId, subscriber) {
        this.#subs.set(filterId, subscriber);
        const pending = this.#pending.get(filterId);
        if (pending) {
            for (const message of pending) {
                subscriber._handleMessage(message);
            }
            this.#pending.delete(filterId);
        }
    }
    async _send(payload) {
        // WebSocket provider doesn't accept batches
        (0,_utils_index_js__WEBPACK_IMPORTED_MODULE_0__.assertArgument)(!Array.isArray(payload), "WebSocket does not support batch send", "payload", payload);
        // @TODO: stringify payloads here and store to prevent mutations
        // Prepare a promise to respond to
        const promise = new Promise((resolve, reject) => {
            this.#callbacks.set(payload.id, { payload, resolve, reject });
        });
        // Wait until the socket is connected before writing to it
        await this._waitUntilReady();
        // Write the request to the socket
        await this._write(JSON.stringify(payload));
        return [await promise];
    }
    // Sub-classes must call this once they are connected
    /*
    async _start(): Promise<void> {
        if (this.#ready) { return; }

        for (const { payload } of this.#callbacks.values()) {
            await this._write(JSON.stringify(payload));
        }

        this.#ready = (async function() {
            await super._start();
        })();
    }
    */
    // Sub-classes must call this for each message
    async _processMessage(message) {
        const result = (JSON.parse(message));
        if ("id" in result) {
            const callback = this.#callbacks.get(result.id);
            if (callback == null) {
                console.log("Weird... Response for not a thing we sent");
                return;
            }
            this.#callbacks.delete(result.id);
            callback.resolve(result);
            /*
                        if ("error" in result) {
                            const { message, code, data } = result.error;
                            const error = makeError(message || "unkonwn error", "SERVER_ERROR", {
                                request: `ws:${ JSON.stringify(callback.payload) }`,
                                info: { code, data }
                            });
                            callback.reject(error);
                        } else {
                            callback.resolve(result.result);
                        }
            */
        }
        else if (result.method === "eth_subscription") {
            const filterId = result.params.subscription;
            const subscriber = this.#subs.get(filterId);
            if (subscriber) {
                subscriber._handleMessage(result.params.result);
            }
            else {
                let pending = this.#pending.get(filterId);
                if (pending == null) {
                    pending = [];
                    this.#pending.set(filterId, pending);
                }
                pending.push(result.params.result);
            }
        }
    }
    async _write(message) {
        throw new Error("sub-classes must override this");
    }
}
//# sourceMappingURL=provider-socket.js.map

/***/ }),

/***/ "./node_modules/ethers/lib.esm/providers/provider-websocket.js":
/*!*********************************************************************!*\
  !*** ./node_modules/ethers/lib.esm/providers/provider-websocket.js ***!
  \*********************************************************************/
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "WebSocketProvider": () => (/* binding */ WebSocketProvider)
/* harmony export */ });
/* harmony import */ var _ws_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./ws.js */ "./node_modules/ethers/lib.esm/providers/ws-browser.js");
/* harmony import */ var _provider_socket_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./provider-socket.js */ "./node_modules/ethers/lib.esm/providers/provider-socket.js");
 /*-browser*/

class WebSocketProvider extends _provider_socket_js__WEBPACK_IMPORTED_MODULE_0__.SocketProvider {
    #connect;
    #websocket;
    get websocket() {
        if (this.#websocket == null) {
            throw new Error("websocket closed");
        }
        return this.#websocket;
    }
    constructor(url, network) {
        super(network);
        if (typeof (url) === "string") {
            this.#connect = () => { return new _ws_js__WEBPACK_IMPORTED_MODULE_1__.WebSocket(url); };
            this.#websocket = this.#connect();
        }
        else if (typeof (url) === "function") {
            this.#connect = url;
            this.#websocket = url();
        }
        else {
            this.#connect = null;
            this.#websocket = url;
        }
        this.websocket.onopen = async () => {
            try {
                await this._start();
                this.resume();
            }
            catch (error) {
                console.log("failed to start WebsocketProvider", error);
                // @TODO: now what? Attempt reconnect?
            }
        };
        this.websocket.onmessage = (message) => {
            this._processMessage(message.data);
        };
        /*
                this.websocket.onclose = (event) => {
                    // @TODO: What event.code should we reconnect on?
                    const reconnect = false;
                    if (reconnect) {
                        this.pause(true);
                        if (this.#connect) {
                            this.#websocket = this.#connect();
                            this.#websocket.onopen = ...
                            // @TODO: this requires the super class to rebroadcast; move it there
                        }
                        this._reconnect();
                    }
                };
        */
    }
    async _write(message) {
        this.websocket.send(message);
    }
    async destroy() {
        if (this.#websocket != null) {
            this.#websocket.close();
            this.#websocket = null;
        }
        super.destroy();
    }
}
//# sourceMappingURL=provider-websocket.js.map

/***/ }),

/***/ "./node_modules/ethers/lib.esm/providers/provider.js":
/*!***********************************************************!*\
  !*** ./node_modules/ethers/lib.esm/providers/provider.js ***!
  \***********************************************************/
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "Block": () => (/* binding */ Block),
/* harmony export */   "FeeData": () => (/* binding */ FeeData),
/* harmony export */   "Log": () => (/* binding */ Log),
/* harmony export */   "TransactionReceipt": () => (/* binding */ TransactionReceipt),
/* harmony export */   "TransactionResponse": () => (/* binding */ TransactionResponse),
/* harmony export */   "copyRequest": () => (/* binding */ copyRequest)
/* harmony export */ });
/* harmony import */ var _utils_index_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../utils/index.js */ "./node_modules/ethers/lib.esm/utils/properties.js");
/* harmony import */ var _utils_index_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../utils/index.js */ "./node_modules/ethers/lib.esm/utils/data.js");
/* harmony import */ var _utils_index_js__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ../utils/index.js */ "./node_modules/ethers/lib.esm/utils/maths.js");
/* harmony import */ var _utils_index_js__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ../utils/index.js */ "./node_modules/ethers/lib.esm/utils/errors.js");
/* harmony import */ var _transaction_index_js__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ../transaction/index.js */ "./node_modules/ethers/lib.esm/transaction/accesslist.js");
//import { resolveAddress } from "@ethersproject/address";


const BN_0 = BigInt(0);
// -----------------------
function getValue(value) {
    if (value == null) {
        return null;
    }
    return value;
}
function toJson(value) {
    if (value == null) {
        return null;
    }
    return value.toString();
}
// @TODO? <T extends FeeData = { }> implements Required<T>
/**
 *  A **FeeData** wraps all the fee-related values associated with
 *  the network.
 */
class FeeData {
    /**
     *  The gas price for legacy networks.
     */
    gasPrice;
    /**
     *  The maximum fee to pay per gas.
     *
     *  The base fee per gas is defined by the network and based on
     *  congestion, increasing the cost during times of heavy load
     *  and lowering when less busy.
     *
     *  The actual fee per gas will be the base fee for the block
     *  and the priority fee, up to the max fee per gas.
     *
     *  This will be ``null`` on legacy networks (i.e. [pre-EIP-1559](link-eip-1559))
     */
    maxFeePerGas;
    /**
     *  The additional amout to pay per gas to encourage a validator
     *  to include the transaction.
     *
     *  The purpose of this is to compensate the validator for the
     *  adjusted risk for including a given transaction.
     *
     *  This will be ``null`` on legacy networks (i.e. [pre-EIP-1559](link-eip-1559))
     */
    maxPriorityFeePerGas;
    /**
     *  Creates a new FeeData for %%gasPrice%%, %%maxFeePerGas%% and
     *  %%maxPriorityFeePerGas%%.
     */
    constructor(gasPrice, maxFeePerGas, maxPriorityFeePerGas) {
        (0,_utils_index_js__WEBPACK_IMPORTED_MODULE_0__.defineProperties)(this, {
            gasPrice: getValue(gasPrice),
            maxFeePerGas: getValue(maxFeePerGas),
            maxPriorityFeePerGas: getValue(maxPriorityFeePerGas)
        });
    }
    /**
     *  Returns a JSON-friendly value.
     */
    toJSON() {
        const { gasPrice, maxFeePerGas, maxPriorityFeePerGas } = this;
        return {
            _type: "FeeData",
            gasPrice: toJson(gasPrice),
            maxFeePerGas: toJson(maxFeePerGas),
            maxPriorityFeePerGas: toJson(maxPriorityFeePerGas),
        };
    }
}
;
function copyRequest(req) {
    const result = {};
    // These could be addresses, ENS names or Addressables
    if (req.to) {
        result.to = req.to;
    }
    if (req.from) {
        result.from = req.from;
    }
    if (req.data) {
        result.data = (0,_utils_index_js__WEBPACK_IMPORTED_MODULE_1__.hexlify)(req.data);
    }
    const bigIntKeys = "chainId,gasLimit,gasPrice,maxFeePerGas,maxPriorityFeePerGas,value".split(/,/);
    for (const key of bigIntKeys) {
        if (!(key in req) || req[key] == null) {
            continue;
        }
        result[key] = (0,_utils_index_js__WEBPACK_IMPORTED_MODULE_2__.getBigInt)(req[key], `request.${key}`);
    }
    const numberKeys = "type,nonce".split(/,/);
    for (const key of numberKeys) {
        if (!(key in req) || req[key] == null) {
            continue;
        }
        result[key] = (0,_utils_index_js__WEBPACK_IMPORTED_MODULE_2__.getNumber)(req[key], `request.${key}`);
    }
    if (req.accessList) {
        result.accessList = (0,_transaction_index_js__WEBPACK_IMPORTED_MODULE_3__.accessListify)(req.accessList);
    }
    if ("blockTag" in req) {
        result.blockTag = req.blockTag;
    }
    if ("enableCcipRead" in req) {
        result.enableCcipReadEnabled = !!req.enableCcipRead;
    }
    if ("customData" in req) {
        result.customData = req.customData;
    }
    return result;
}
/**
 *  A **Block** represents the data associated with a full block on
 *  Ethereum.
 */
class Block {
    /**
     *  The provider connected to the block used to fetch additional details
     *  if necessary.
     */
    provider;
    /**
     *  The block number, sometimes called the block height. This is a
     *  sequential number that is one higher than the parent block.
     */
    number;
    /**
     *  The block hash.
     */
    hash;
    /**
     *  The timestamp for this block, which is the number of seconds since
     *  epoch that this block was included.
     */
    timestamp;
    /**
     *  The block hash of the parent block.
     */
    parentHash;
    /**
     *  The nonce.
     *
     *  On legacy networks, this is the random number inserted which
     *  permitted the difficulty target to be reached.
     */
    nonce;
    /**
     *  The difficulty target.
     *
     *  On legacy networks, this is the proof-of-work target required
     *  for a block to meet the protocol rules to be included.
     *
     *  On modern networks, this is a random number arrived at using
     *  randao.  @TODO: Find links?
     */
    difficulty;
    /**
     *  The total gas limit for this block.
     */
    gasLimit;
    /**
     *  The total gas used in this block.
     */
    gasUsed;
    /**
     *  The miner coinbase address, wihch receives any subsidies for
     *  including this block.
     */
    miner;
    /**
     *  Any extra data the validator wished to include.
     */
    extraData;
    /**
     *  The base fee per gas that all transactions in this block were
     *  charged.
     *
     *  This adjusts after each block, depending on how congested the network
     *  is.
     */
    baseFeePerGas;
    #transactions;
    /**
     *  Create a new **Block** object.
     *
     *  This should generally not be necessary as the unless implementing a
     *  low-level library.
     */
    constructor(block, provider) {
        this.#transactions = block.transactions.map((tx) => {
            if (typeof (tx) !== "string") {
                return new TransactionResponse(tx, provider);
            }
            return tx;
        });
        (0,_utils_index_js__WEBPACK_IMPORTED_MODULE_0__.defineProperties)(this, {
            provider,
            hash: getValue(block.hash),
            number: block.number,
            timestamp: block.timestamp,
            parentHash: block.parentHash,
            nonce: block.nonce,
            difficulty: block.difficulty,
            gasLimit: block.gasLimit,
            gasUsed: block.gasUsed,
            miner: block.miner,
            extraData: block.extraData,
            baseFeePerGas: getValue(block.baseFeePerGas)
        });
    }
    /**
     *  Returns the list of transaction hashes.
     */
    get transactions() {
        return this.#transactions.map((tx) => {
            if (typeof (tx) === "string") {
                return tx;
            }
            return tx.hash;
        });
    }
    /**
     *  Returns the complete transactions for blocks which
     *  prefetched them, by passing ``true`` to %%prefetchTxs%%
     *  into [[provider_getBlock]].
     */
    get prefetchedTransactions() {
        const txs = this.#transactions.slice();
        // Doesn't matter...
        if (txs.length === 0) {
            return [];
        }
        // Make sure we prefetched the transactions
        (0,_utils_index_js__WEBPACK_IMPORTED_MODULE_4__.assert)(typeof (txs[0]) === "object", "transactions were not prefetched with block request", "UNSUPPORTED_OPERATION", {
            operation: "transactionResponses()"
        });
        return txs;
    }
    /**
     *  Returns a JSON-friendly value.
     */
    toJSON() {
        const { baseFeePerGas, difficulty, extraData, gasLimit, gasUsed, hash, miner, nonce, number, parentHash, timestamp, transactions } = this;
        return {
            _type: "Block",
            baseFeePerGas: toJson(baseFeePerGas),
            difficulty: toJson(difficulty),
            extraData,
            gasLimit: toJson(gasLimit),
            gasUsed: toJson(gasUsed),
            hash, miner, nonce, number, parentHash, timestamp,
            transactions,
        };
    }
    [Symbol.iterator]() {
        let index = 0;
        const txs = this.transactions;
        return {
            next: () => {
                if (index < this.length) {
                    return {
                        value: txs[index++], done: false
                    };
                }
                return { value: undefined, done: true };
            }
        };
    }
    /**
     *  The number of transactions in this block.
     */
    get length() { return this.#transactions.length; }
    /**
     *  The [[link-js-date]] this block was included at.
     */
    get date() {
        if (this.timestamp == null) {
            return null;
        }
        return new Date(this.timestamp * 1000);
    }
    /**
     *  Get the transaction at %%indexe%% within this block.
     */
    async getTransaction(indexOrHash) {
        // Find the internal value by its index or hash
        let tx = undefined;
        if (typeof (indexOrHash) === "number") {
            tx = this.#transactions[indexOrHash];
        }
        else {
            const hash = indexOrHash.toLowerCase();
            for (const v of this.#transactions) {
                if (typeof (v) === "string") {
                    if (v !== hash) {
                        continue;
                    }
                    tx = v;
                    break;
                }
                else {
                    if (v.hash === hash) {
                        continue;
                    }
                    tx = v;
                    break;
                }
            }
        }
        if (tx == null) {
            throw new Error("no such tx");
        }
        if (typeof (tx) === "string") {
            return (await this.provider.getTransaction(tx));
        }
        else {
            return tx;
        }
    }
    getPrefetchedTransaction(indexOrHash) {
        const txs = this.prefetchedTransactions;
        if (typeof (indexOrHash) === "number") {
            return txs[indexOrHash];
        }
        indexOrHash = indexOrHash.toLowerCase();
        for (const tx of txs) {
            if (tx.hash === indexOrHash) {
                return tx;
            }
        }
        (0,_utils_index_js__WEBPACK_IMPORTED_MODULE_4__.assertArgument)(false, "no matching transaction", "indexOrHash", indexOrHash);
    }
    /**
     *  Has this block been mined.
     *
     *  If true, the block has been typed-gaurded that all mined
     *  properties are non-null.
     */
    isMined() { return !!this.hash; }
    /**
     *
     */
    isLondon() {
        return !!this.baseFeePerGas;
    }
    orphanedEvent() {
        if (!this.isMined()) {
            throw new Error("");
        }
        return createOrphanedBlockFilter(this);
    }
}
//////////////////////
// Log
class Log {
    provider;
    transactionHash;
    blockHash;
    blockNumber;
    removed;
    address;
    data;
    topics;
    index;
    transactionIndex;
    constructor(log, provider) {
        this.provider = provider;
        const topics = Object.freeze(log.topics.slice());
        (0,_utils_index_js__WEBPACK_IMPORTED_MODULE_0__.defineProperties)(this, {
            transactionHash: log.transactionHash,
            blockHash: log.blockHash,
            blockNumber: log.blockNumber,
            removed: log.removed,
            address: log.address,
            data: log.data,
            topics,
            index: log.index,
            transactionIndex: log.transactionIndex,
        });
    }
    toJSON() {
        const { address, blockHash, blockNumber, data, index, removed, topics, transactionHash, transactionIndex } = this;
        return {
            _type: "log",
            address, blockHash, blockNumber, data, index,
            removed, topics, transactionHash, transactionIndex
        };
    }
    async getBlock() {
        const block = await this.provider.getBlock(this.blockHash);
        (0,_utils_index_js__WEBPACK_IMPORTED_MODULE_4__.assert)(!!block, "failed to find transaction", "UNKNOWN_ERROR", {});
        return block;
    }
    async getTransaction() {
        const tx = await this.provider.getTransaction(this.transactionHash);
        (0,_utils_index_js__WEBPACK_IMPORTED_MODULE_4__.assert)(!!tx, "failed to find transaction", "UNKNOWN_ERROR", {});
        return tx;
    }
    async getTransactionReceipt() {
        const receipt = await this.provider.getTransactionReceipt(this.transactionHash);
        (0,_utils_index_js__WEBPACK_IMPORTED_MODULE_4__.assert)(!!receipt, "failed to find transaction receipt", "UNKNOWN_ERROR", {});
        return receipt;
    }
    removedEvent() {
        return createRemovedLogFilter(this);
    }
}
//////////////////////
// Transaction Receipt
/*
export interface LegacyTransactionReceipt {
    byzantium: false;
    status: null;
    root: string;
}

export interface ByzantiumTransactionReceipt {
    byzantium: true;
    status: number;
    root: null;
}
*/
class TransactionReceipt {
    provider;
    to;
    from;
    contractAddress;
    hash;
    index;
    blockHash;
    blockNumber;
    logsBloom;
    gasUsed;
    cumulativeGasUsed;
    gasPrice;
    type;
    //readonly byzantium!: boolean;
    status;
    root;
    #logs;
    constructor(tx, provider) {
        this.#logs = Object.freeze(tx.logs.map((log) => {
            return new Log(log, provider);
        }));
        (0,_utils_index_js__WEBPACK_IMPORTED_MODULE_0__.defineProperties)(this, {
            provider,
            to: tx.to,
            from: tx.from,
            contractAddress: tx.contractAddress,
            hash: tx.hash,
            index: tx.index,
            blockHash: tx.blockHash,
            blockNumber: tx.blockNumber,
            logsBloom: tx.logsBloom,
            gasUsed: tx.gasUsed,
            cumulativeGasUsed: tx.cumulativeGasUsed,
            gasPrice: (tx.effectiveGasPrice || tx.gasPrice),
            type: tx.type,
            //byzantium: tx.byzantium,
            status: tx.status,
            root: tx.root
        });
    }
    get logs() { return this.#logs; }
    toJSON() {
        const { to, from, contractAddress, hash, index, blockHash, blockNumber, logsBloom, logs, //byzantium, 
        status, root } = this;
        return {
            _type: "TransactionReceipt",
            blockHash, blockNumber,
            //byzantium, 
            contractAddress,
            cumulativeGasUsed: toJson(this.cumulativeGasUsed),
            from,
            gasPrice: toJson(this.gasPrice),
            gasUsed: toJson(this.gasUsed),
            hash, index, logs, logsBloom, root, status, to
        };
    }
    get length() { return this.logs.length; }
    [Symbol.iterator]() {
        let index = 0;
        return {
            next: () => {
                if (index < this.length) {
                    return { value: this.logs[index++], done: false };
                }
                return { value: undefined, done: true };
            }
        };
    }
    get fee() {
        return this.gasUsed * this.gasPrice;
    }
    async getBlock() {
        const block = await this.provider.getBlock(this.blockHash);
        if (block == null) {
            throw new Error("TODO");
        }
        return block;
    }
    async getTransaction() {
        const tx = await this.provider.getTransaction(this.hash);
        if (tx == null) {
            throw new Error("TODO");
        }
        return tx;
    }
    async getResult() {
        return (await this.provider.getTransactionResult(this.hash));
    }
    async confirmations() {
        return (await this.provider.getBlockNumber()) - this.blockNumber + 1;
    }
    removedEvent() {
        return createRemovedTransactionFilter(this);
    }
    reorderedEvent(other) {
        (0,_utils_index_js__WEBPACK_IMPORTED_MODULE_4__.assert)(!other || other.isMined(), "unmined 'other' transction cannot be orphaned", "UNSUPPORTED_OPERATION", { operation: "reorderedEvent(other)" });
        return createReorderedTransactionFilter(this, other);
    }
}
/*
export type ReplacementDetectionSetup = {
    to: string;
    from: string;
    value: bigint;
    data: string;
    nonce: number;
    block: number;
};
*/
class TransactionResponse {
    provider;
    blockNumber;
    blockHash;
    index;
    hash;
    type;
    to;
    from;
    nonce;
    gasLimit;
    gasPrice;
    maxPriorityFeePerGas;
    maxFeePerGas;
    data;
    value;
    chainId;
    signature;
    accessList;
    #startBlock;
    constructor(tx, provider) {
        this.provider = provider;
        this.blockNumber = (tx.blockNumber != null) ? tx.blockNumber : null;
        this.blockHash = (tx.blockHash != null) ? tx.blockHash : null;
        this.hash = tx.hash;
        this.index = tx.index;
        this.type = tx.type;
        this.from = tx.from;
        this.to = tx.to || null;
        this.gasLimit = tx.gasLimit;
        this.nonce = tx.nonce;
        this.data = tx.data;
        this.value = tx.value;
        this.gasPrice = tx.gasPrice;
        this.maxPriorityFeePerGas = (tx.maxPriorityFeePerGas != null) ? tx.maxPriorityFeePerGas : null;
        this.maxFeePerGas = (tx.maxFeePerGas != null) ? tx.maxFeePerGas : null;
        this.chainId = tx.chainId;
        this.signature = tx.signature;
        this.accessList = (tx.accessList != null) ? tx.accessList : null;
        this.#startBlock = -1;
    }
    toJSON() {
        const { blockNumber, blockHash, index, hash, type, to, from, nonce, data, signature, accessList } = this;
        return {
            _type: "TransactionReceipt",
            accessList, blockNumber, blockHash,
            chainId: toJson(this.chainId),
            data, from,
            gasLimit: toJson(this.gasLimit),
            gasPrice: toJson(this.gasPrice),
            hash,
            maxFeePerGas: toJson(this.maxFeePerGas),
            maxPriorityFeePerGas: toJson(this.maxPriorityFeePerGas),
            nonce, signature, to, index, type,
            value: toJson(this.value),
        };
    }
    async getBlock() {
        let blockNumber = this.blockNumber;
        if (blockNumber == null) {
            const tx = await this.getTransaction();
            if (tx) {
                blockNumber = tx.blockNumber;
            }
        }
        if (blockNumber == null) {
            return null;
        }
        const block = this.provider.getBlock(blockNumber);
        if (block == null) {
            throw new Error("TODO");
        }
        return block;
    }
    async getTransaction() {
        return this.provider.getTransaction(this.hash);
    }
    async wait(_confirms, _timeout) {
        const confirms = (_confirms == null) ? 1 : _confirms;
        const timeout = (_timeout == null) ? 0 : _timeout;
        let startBlock = this.#startBlock;
        let nextScan = -1;
        let stopScanning = (startBlock === -1) ? true : false;
        const checkReplacement = async () => {
            // Get the current transaction count for this sender
            if (stopScanning) {
                return null;
            }
            const { blockNumber, nonce } = await (0,_utils_index_js__WEBPACK_IMPORTED_MODULE_0__.resolveProperties)({
                blockNumber: this.provider.getBlockNumber(),
                nonce: this.provider.getTransactionCount(this.from)
            });
            // No transaction or our nonce has not been mined yet; but we
            // can start scanning later when we do start
            if (nonce < this.nonce) {
                startBlock = blockNumber;
                return;
            }
            // We were mined; no replacement
            if (stopScanning) {
                return null;
            }
            const mined = await this.getTransaction();
            if (mined && mined.blockNumber != null) {
                return;
            }
            // We were replaced; start scanning for that transaction
            // Starting to scan; look back a few extra blocks for safety
            if (nextScan === -1) {
                nextScan = startBlock - 3;
                if (nextScan < this.#startBlock) {
                    nextScan = this.#startBlock;
                }
            }
            while (nextScan <= blockNumber) {
                // Get the next block to scan
                if (stopScanning) {
                    return null;
                }
                const block = await this.provider.getBlock(nextScan, true);
                // This should not happen; but we'll try again shortly
                if (block == null) {
                    return;
                }
                // We were mined; no replacement
                for (const hash of block) {
                    if (hash === this.hash) {
                        return;
                    }
                }
                // Search for the transaction that replaced us
                for (let i = 0; i < block.length; i++) {
                    const tx = await block.getTransaction(i);
                    if (tx.from === this.from && tx.nonce === this.nonce) {
                        // Get the receipt
                        if (stopScanning) {
                            return null;
                        }
                        const receipt = await this.provider.getTransactionReceipt(tx.hash);
                        // This should not happen; but we'll try again shortly
                        if (receipt == null) {
                            return;
                        }
                        // We will retry this on the next block (this case could be optimized)
                        if ((blockNumber - receipt.blockNumber + 1) < confirms) {
                            return;
                        }
                        // The reason we were replaced
                        let reason = "replaced";
                        if (tx.data === this.data && tx.to === this.to && tx.value === this.value) {
                            reason = "repriced";
                        }
                        else if (tx.data === "0x" && tx.from === tx.to && tx.value === BN_0) {
                            reason = "cancelled";
                        }
                        (0,_utils_index_js__WEBPACK_IMPORTED_MODULE_4__.assert)(false, "transaction was replaced", "TRANSACTION_REPLACED", {
                            cancelled: (reason === "replaced" || reason === "cancelled"),
                            reason,
                            replacement: tx.replaceableTransaction(startBlock),
                            hash: tx.hash,
                            receipt
                        });
                    }
                }
                nextScan++;
            }
            return;
        };
        const receipt = await this.provider.getTransactionReceipt(this.hash);
        if (receipt) {
            if ((await receipt.confirmations()) >= confirms) {
                return receipt;
            }
        }
        else {
            // Check for a replacement; throws if a replacement was found
            await checkReplacement();
            // Allow null only when the confirms is 0
            if (confirms === 0) {
                return null;
            }
        }
        const waiter = new Promise((resolve, reject) => {
            // List of things to cancel when we have a result (one way or the other)
            const cancellers = [];
            const cancel = () => { cancellers.forEach((c) => c()); };
            // On cancel, stop scanning for replacements
            cancellers.push(() => { stopScanning = true; });
            // Set up any timeout requested
            if (timeout > 0) {
                const timer = setTimeout(() => {
                    cancel();
                    reject((0,_utils_index_js__WEBPACK_IMPORTED_MODULE_4__.makeError)("wait for transaction timeout", "TIMEOUT"));
                }, timeout);
                cancellers.push(() => { clearTimeout(timer); });
            }
            const txListener = async (receipt) => {
                // Done; return it!
                if ((await receipt.confirmations()) >= confirms) {
                    cancel();
                    resolve(receipt);
                }
            };
            cancellers.push(() => { this.provider.off(this.hash, txListener); });
            this.provider.on(this.hash, txListener);
            // We support replacement detection; start checking
            if (startBlock >= 0) {
                const replaceListener = async () => {
                    try {
                        // Check for a replacement; this throws only if one is found
                        await checkReplacement();
                    }
                    catch (error) {
                        // We were replaced (with enough confirms); re-throw the error
                        if ((0,_utils_index_js__WEBPACK_IMPORTED_MODULE_4__.isError)(error, "TRANSACTION_REPLACED")) {
                            cancel();
                            reject(error);
                            return;
                        }
                    }
                    // Rescheudle a check on the next block
                    if (!stopScanning) {
                        this.provider.once("block", replaceListener);
                    }
                };
                cancellers.push(() => { this.provider.off("block", replaceListener); });
                this.provider.once("block", replaceListener);
            }
        });
        return await waiter;
    }
    isMined() {
        return (this.blockHash != null);
    }
    isLegacy() {
        return (this.type === 0);
    }
    isBerlin() {
        return (this.type === 1);
    }
    isLondon() {
        return (this.type === 2);
    }
    removedEvent() {
        (0,_utils_index_js__WEBPACK_IMPORTED_MODULE_4__.assert)(this.isMined(), "unmined transaction canot be orphaned", "UNSUPPORTED_OPERATION", { operation: "removeEvent()" });
        return createRemovedTransactionFilter(this);
    }
    reorderedEvent(other) {
        (0,_utils_index_js__WEBPACK_IMPORTED_MODULE_4__.assert)(this.isMined(), "unmined transaction canot be orphaned", "UNSUPPORTED_OPERATION", { operation: "removeEvent()" });
        (0,_utils_index_js__WEBPACK_IMPORTED_MODULE_4__.assert)(!other || other.isMined(), "unmined 'other' transaction canot be orphaned", "UNSUPPORTED_OPERATION", { operation: "removeEvent()" });
        return createReorderedTransactionFilter(this, other);
    }
    /**
     *  Returns a new TransactionResponse instance which has the ability to
     *  detect (and throw an error) if the transaction is replaced, which
     *  will begin scanning at %%startBlock%%.
     *
     *  This should generally not be used by developers and is intended
     *  primarily for internal use. Setting an incorrect %%startBlock%% can
     *  have devastating performance consequences if used incorrectly.
     */
    replaceableTransaction(startBlock) {
        (0,_utils_index_js__WEBPACK_IMPORTED_MODULE_4__.assertArgument)(Number.isInteger(startBlock) && startBlock >= 0, "invalid startBlock", "startBlock", startBlock);
        const tx = new TransactionResponse(this, this.provider);
        tx.#startBlock = startBlock;
        return tx;
    }
}
function createOrphanedBlockFilter(block) {
    return { orphan: "drop-block", hash: block.hash, number: block.number };
}
function createReorderedTransactionFilter(tx, other) {
    return { orphan: "reorder-transaction", tx, other };
}
function createRemovedTransactionFilter(tx) {
    return { orphan: "drop-transaction", tx };
}
function createRemovedLogFilter(log) {
    return { orphan: "drop-log", log: {
            transactionHash: log.transactionHash,
            blockHash: log.blockHash,
            blockNumber: log.blockNumber,
            address: log.address,
            data: log.data,
            topics: Object.freeze(log.topics.slice()),
            index: log.index
        } };
}
//# sourceMappingURL=provider.js.map

/***/ }),

/***/ "./node_modules/ethers/lib.esm/providers/subscriber-filterid.js":
/*!**********************************************************************!*\
  !*** ./node_modules/ethers/lib.esm/providers/subscriber-filterid.js ***!
  \**********************************************************************/
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "FilterIdEventSubscriber": () => (/* binding */ FilterIdEventSubscriber),
/* harmony export */   "FilterIdPendingSubscriber": () => (/* binding */ FilterIdPendingSubscriber),
/* harmony export */   "FilterIdSubscriber": () => (/* binding */ FilterIdSubscriber)
/* harmony export */ });
/* harmony import */ var _utils_index_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../utils/index.js */ "./node_modules/ethers/lib.esm/utils/errors.js");
/* harmony import */ var _subscriber_polling_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./subscriber-polling.js */ "./node_modules/ethers/lib.esm/providers/subscriber-polling.js");


function copy(obj) {
    return JSON.parse(JSON.stringify(obj));
}
/**
 *  Some backends support subscribing to events using a Filter ID.
 *
 *  When subscribing with this technique, the node issues a unique
 *  //Filter ID//. At this point the node dedicates resources to
 *  the filter, so that periodic calls to follow up on the //Filter ID//
 *  will receive any events since the last call.
 *
 *  @_docloc: api/providers/abstract-provider
 */
class FilterIdSubscriber {
    #provider;
    #filterIdPromise;
    #poller;
    #running;
    #network;
    #hault;
    constructor(provider) {
        this.#provider = provider;
        this.#filterIdPromise = null;
        this.#poller = this.#poll.bind(this);
        this.#running = false;
        this.#network = null;
        this.#hault = false;
    }
    _subscribe(provider) {
        throw new Error("subclasses must override this");
    }
    _emitResults(provider, result) {
        throw new Error("subclasses must override this");
    }
    _recover(provider) {
        throw new Error("subclasses must override this");
    }
    async #poll(blockNumber) {
        try {
            // Subscribe if necessary
            if (this.#filterIdPromise == null) {
                this.#filterIdPromise = this._subscribe(this.#provider);
            }
            // Get the Filter ID
            let filterId = null;
            try {
                filterId = await this.#filterIdPromise;
            }
            catch (error) {
                if (!(0,_utils_index_js__WEBPACK_IMPORTED_MODULE_0__.isError)(error, "UNSUPPORTED_OPERATION") || error.operation !== "eth_newFilter") {
                    throw error;
                }
            }
            // The backend does not support Filter ID; downgrade to
            // polling
            if (filterId == null) {
                this.#filterIdPromise = null;
                this.#provider._recoverSubscriber(this, this._recover(this.#provider));
                return;
            }
            const network = await this.#provider.getNetwork();
            if (!this.#network) {
                this.#network = network;
            }
            if (this.#network.chainId !== network.chainId) {
                throw new Error("chaid changed");
            }
            if (this.#hault) {
                return;
            }
            const result = await this.#provider.send("eth_getFilterChanges", [filterId]);
            await this._emitResults(this.#provider, result);
        }
        catch (error) {
            console.log("@TODO", error);
        }
        this.#provider.once("block", this.#poller);
    }
    #teardown() {
        const filterIdPromise = this.#filterIdPromise;
        if (filterIdPromise) {
            this.#filterIdPromise = null;
            filterIdPromise.then((filterId) => {
                this.#provider.send("eth_uninstallFilter", [filterId]);
            });
        }
    }
    start() {
        if (this.#running) {
            return;
        }
        this.#running = true;
        this.#poll(-2);
    }
    stop() {
        if (!this.#running) {
            return;
        }
        this.#running = false;
        this.#hault = true;
        this.#teardown();
        this.#provider.off("block", this.#poller);
    }
    pause(dropWhilePaused) {
        if (dropWhilePaused) {
            this.#teardown();
        }
        this.#provider.off("block", this.#poller);
    }
    resume() { this.start(); }
}
/**
 *  A **FilterIdSubscriber** for receiving contract events.
 *
 *  @_docloc: api/providers/abstract-provider
 */
class FilterIdEventSubscriber extends FilterIdSubscriber {
    #event;
    constructor(provider, filter) {
        super(provider);
        this.#event = copy(filter);
    }
    _recover(provider) {
        return new _subscriber_polling_js__WEBPACK_IMPORTED_MODULE_1__.PollingEventSubscriber(provider, this.#event);
    }
    async _subscribe(provider) {
        const filterId = await provider.send("eth_newFilter", [this.#event]);
        return filterId;
    }
    async _emitResults(provider, results) {
        for (const result of results) {
            provider.emit(this.#event, provider._wrapLog(result, provider._network));
        }
    }
}
/**
 *  A **FilterIdSubscriber** for receiving pending transactions events.
 *
 *  @_docloc: api/providers/abstract-provider
 */
class FilterIdPendingSubscriber extends FilterIdSubscriber {
    async _subscribe(provider) {
        return await provider.send("eth_newPendingTransactionFilter", []);
    }
    async _emitResults(provider, results) {
        for (const result of results) {
            provider.emit("pending", result);
        }
    }
}
//# sourceMappingURL=subscriber-filterid.js.map

/***/ }),

/***/ "./node_modules/ethers/lib.esm/providers/subscriber-polling.js":
/*!*********************************************************************!*\
  !*** ./node_modules/ethers/lib.esm/providers/subscriber-polling.js ***!
  \*********************************************************************/
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "OnBlockSubscriber": () => (/* binding */ OnBlockSubscriber),
/* harmony export */   "PollingBlockSubscriber": () => (/* binding */ PollingBlockSubscriber),
/* harmony export */   "PollingEventSubscriber": () => (/* binding */ PollingEventSubscriber),
/* harmony export */   "PollingOrphanSubscriber": () => (/* binding */ PollingOrphanSubscriber),
/* harmony export */   "PollingTransactionSubscriber": () => (/* binding */ PollingTransactionSubscriber),
/* harmony export */   "getPollingSubscriber": () => (/* binding */ getPollingSubscriber)
/* harmony export */ });
/* harmony import */ var _utils_index_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../utils/index.js */ "./node_modules/ethers/lib.esm/utils/data.js");
/* harmony import */ var _utils_index_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../utils/index.js */ "./node_modules/ethers/lib.esm/utils/errors.js");

function copy(obj) {
    return JSON.parse(JSON.stringify(obj));
}
/**
 *  @TODO
 *
 *  @_docloc: api/providers/abstract-provider
 */
function getPollingSubscriber(provider, event) {
    if (event === "block") {
        return new PollingBlockSubscriber(provider);
    }
    if ((0,_utils_index_js__WEBPACK_IMPORTED_MODULE_0__.isHexString)(event, 32)) {
        return new PollingTransactionSubscriber(provider, event);
    }
    (0,_utils_index_js__WEBPACK_IMPORTED_MODULE_1__.assert)(false, "unsupported polling event", "UNSUPPORTED_OPERATION", {
        operation: "getPollingSubscriber", info: { event }
    });
}
// @TODO: refactor this
/**
 *  @TODO
 *
 *  @_docloc: api/providers/abstract-provider
 */
class PollingBlockSubscriber {
    #provider;
    #poller;
    #interval;
    // The most recent block we have scanned for events. The value -2
    // indicates we still need to fetch an initial block number
    #blockNumber;
    constructor(provider) {
        this.#provider = provider;
        this.#poller = null;
        this.#interval = 4000;
        this.#blockNumber = -2;
    }
    get pollingInterval() { return this.#interval; }
    set pollingInterval(value) { this.#interval = value; }
    async #poll() {
        const blockNumber = await this.#provider.getBlockNumber();
        if (this.#blockNumber === -2) {
            this.#blockNumber = blockNumber;
            return;
        }
        // @TODO: Put a cap on the maximum number of events per loop?
        if (blockNumber !== this.#blockNumber) {
            for (let b = this.#blockNumber + 1; b <= blockNumber; b++) {
                // We have been stopped
                if (this.#poller == null) {
                    return;
                }
                await this.#provider.emit("block", b);
            }
            this.#blockNumber = blockNumber;
        }
        // We have been stopped
        if (this.#poller == null) {
            return;
        }
        this.#poller = this.#provider._setTimeout(this.#poll.bind(this), this.#interval);
    }
    start() {
        if (this.#poller) {
            return;
        }
        this.#poller = this.#provider._setTimeout(this.#poll.bind(this), this.#interval);
        this.#poll();
    }
    stop() {
        if (!this.#poller) {
            return;
        }
        this.#provider._clearTimeout(this.#poller);
        this.#poller = null;
    }
    pause(dropWhilePaused) {
        this.stop();
        if (dropWhilePaused) {
            this.#blockNumber = -2;
        }
    }
    resume() {
        this.start();
    }
}
/**
 *  @TODO
 *
 *  @_docloc: api/providers/abstract-provider
 */
class OnBlockSubscriber {
    #provider;
    #poll;
    #running;
    constructor(provider) {
        this.#provider = provider;
        this.#running = false;
        this.#poll = (blockNumber) => {
            this._poll(blockNumber, this.#provider);
        };
    }
    async _poll(blockNumber, provider) {
        throw new Error("sub-classes must override this");
    }
    start() {
        if (this.#running) {
            return;
        }
        this.#running = true;
        this.#poll(-2);
        this.#provider.on("block", this.#poll);
    }
    stop() {
        if (!this.#running) {
            return;
        }
        this.#running = false;
        this.#provider.off("block", this.#poll);
    }
    pause(dropWhilePaused) { this.stop(); }
    resume() { this.start(); }
}
/**
 *  @TODO
 *
 *  @_docloc: api/providers/abstract-provider
 */
class PollingOrphanSubscriber extends OnBlockSubscriber {
    #filter;
    constructor(provider, filter) {
        super(provider);
        this.#filter = copy(filter);
    }
    async _poll(blockNumber, provider) {
        throw new Error("@TODO");
        console.log(this.#filter);
    }
}
/**
 *  @TODO
 *
 *  @_docloc: api/providers/abstract-provider
 */
class PollingTransactionSubscriber extends OnBlockSubscriber {
    #hash;
    constructor(provider, hash) {
        super(provider);
        this.#hash = hash;
    }
    async _poll(blockNumber, provider) {
        const tx = await provider.getTransactionReceipt(this.#hash);
        if (tx) {
            provider.emit(this.#hash, tx);
        }
    }
}
/**
 *  @TODO
 *
 *  @_docloc: api/providers/abstract-provider
 */
class PollingEventSubscriber {
    #provider;
    #filter;
    #poller;
    #running;
    // The most recent block we have scanned for events. The value -2
    // indicates we still need to fetch an initial block number
    #blockNumber;
    constructor(provider, filter) {
        this.#provider = provider;
        this.#filter = copy(filter);
        this.#poller = this.#poll.bind(this);
        this.#running = false;
        this.#blockNumber = -2;
    }
    async #poll(blockNumber) {
        // The initial block hasn't been determined yet
        if (this.#blockNumber === -2) {
            return;
        }
        const filter = copy(this.#filter);
        filter.fromBlock = this.#blockNumber + 1;
        filter.toBlock = blockNumber;
        const logs = await this.#provider.getLogs(filter);
        // No logs could just mean the node has not indexed them yet,
        // so we keep a sliding window of 60 blocks to keep scanning
        if (logs.length === 0) {
            if (this.#blockNumber < blockNumber - 60) {
                this.#blockNumber = blockNumber - 60;
            }
            return;
        }
        this.#blockNumber = blockNumber;
        for (const log of logs) {
            this.#provider.emit(this.#filter, log);
        }
    }
    start() {
        if (this.#running) {
            return;
        }
        this.#running = true;
        if (this.#blockNumber === -2) {
            this.#provider.getBlockNumber().then((blockNumber) => {
                this.#blockNumber = blockNumber;
            });
        }
        this.#provider.on("block", this.#poller);
    }
    stop() {
        if (!this.#running) {
            return;
        }
        this.#running = false;
        this.#provider.off("block", this.#poller);
    }
    pause(dropWhilePaused) {
        this.stop();
        if (dropWhilePaused) {
            this.#blockNumber = -2;
        }
    }
    resume() {
        this.start();
    }
}
//# sourceMappingURL=subscriber-polling.js.map

/***/ }),

/***/ "./node_modules/ethers/lib.esm/providers/ws-browser.js":
/*!*************************************************************!*\
  !*** ./node_modules/ethers/lib.esm/providers/ws-browser.js ***!
  \*************************************************************/
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "WebSocket": () => (/* binding */ _WebSocket)
/* harmony export */ });
function getGlobal() {
    if (typeof self !== 'undefined') {
        return self;
    }
    if (typeof window !== 'undefined') {
        return window;
    }
    if (typeof global !== 'undefined') {
        return global;
    }
    throw new Error('unable to locate global object');
}
;
const _WebSocket = getGlobal().WebSocket;

//# sourceMappingURL=ws-browser.js.map

/***/ }),

/***/ "./node_modules/ethers/lib.esm/transaction/accesslist.js":
/*!***************************************************************!*\
  !*** ./node_modules/ethers/lib.esm/transaction/accesslist.js ***!
  \***************************************************************/
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "accessListify": () => (/* binding */ accessListify)
/* harmony export */ });
/* harmony import */ var _address_index_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../address/index.js */ "./node_modules/ethers/lib.esm/address/address.js");
/* harmony import */ var _utils_index_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../utils/index.js */ "./node_modules/ethers/lib.esm/utils/errors.js");
/* harmony import */ var _utils_index_js__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ../utils/index.js */ "./node_modules/ethers/lib.esm/utils/data.js");


function accessSetify(addr, storageKeys) {
    return {
        address: (0,_address_index_js__WEBPACK_IMPORTED_MODULE_0__.getAddress)(addr),
        storageKeys: storageKeys.map((storageKey, index) => {
            (0,_utils_index_js__WEBPACK_IMPORTED_MODULE_1__.assertArgument)((0,_utils_index_js__WEBPACK_IMPORTED_MODULE_2__.isHexString)(storageKey, 32), "invalid slot", `storageKeys[${index}]`, storageKey);
            return storageKey.toLowerCase();
        })
    };
}
/**
 *  Returns a [[AccessList]] from any ethers-supported access-list structure.
 */
function accessListify(value) {
    if (Array.isArray(value)) {
        return value.map((set, index) => {
            if (Array.isArray(set)) {
                (0,_utils_index_js__WEBPACK_IMPORTED_MODULE_1__.assertArgument)(set.length === 2, "invalid slot set", `value[${index}]`, set);
                return accessSetify(set[0], set[1]);
            }
            (0,_utils_index_js__WEBPACK_IMPORTED_MODULE_1__.assertArgument)(set != null && typeof (set) === "object", "invalid address-slot set", "value", value);
            return accessSetify(set.address, set.storageKeys);
        });
    }
    (0,_utils_index_js__WEBPACK_IMPORTED_MODULE_1__.assertArgument)(value != null && typeof (value) === "object", "invalid access list", "value", value);
    const result = Object.keys(value).map((addr) => {
        const storageKeys = value[addr].reduce((accum, storageKey) => {
            accum[storageKey] = true;
            return accum;
        }, {});
        return accessSetify(addr, Object.keys(storageKeys).sort());
    });
    result.sort((a, b) => (a.address.localeCompare(b.address)));
    return result;
}
//# sourceMappingURL=accesslist.js.map

/***/ }),

/***/ "./node_modules/ethers/lib.esm/transaction/address.js":
/*!************************************************************!*\
  !*** ./node_modules/ethers/lib.esm/transaction/address.js ***!
  \************************************************************/
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "computeAddress": () => (/* binding */ computeAddress),
/* harmony export */   "recoverAddress": () => (/* binding */ recoverAddress)
/* harmony export */ });
/* harmony import */ var _address_index_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../address/index.js */ "./node_modules/ethers/lib.esm/address/address.js");
/* harmony import */ var _crypto_index_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../crypto/index.js */ "./node_modules/ethers/lib.esm/crypto/signing-key.js");
/* harmony import */ var _crypto_index_js__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ../crypto/index.js */ "./node_modules/ethers/lib.esm/crypto/keccak.js");


/**
 *  Returns the address for the %%key%%.
 *
 *  The key may be any standard form of public key or a private key.
 */
function computeAddress(key) {
    let pubkey;
    if (typeof (key) === "string") {
        pubkey = _crypto_index_js__WEBPACK_IMPORTED_MODULE_0__.SigningKey.computePublicKey(key, false);
    }
    else {
        pubkey = key.publicKey;
    }
    return (0,_address_index_js__WEBPACK_IMPORTED_MODULE_1__.getAddress)((0,_crypto_index_js__WEBPACK_IMPORTED_MODULE_2__.keccak256)("0x" + pubkey.substring(4)).substring(26));
}
/**
 *  Returns the recovered address for the private key that was
 *  used to sign %%digest%% that resulted in %%signature%%.
 */
function recoverAddress(digest, signature) {
    return computeAddress(_crypto_index_js__WEBPACK_IMPORTED_MODULE_0__.SigningKey.recoverPublicKey(digest, signature));
}
//# sourceMappingURL=address.js.map

/***/ }),

/***/ "./node_modules/ethers/lib.esm/transaction/transaction.js":
/*!****************************************************************!*\
  !*** ./node_modules/ethers/lib.esm/transaction/transaction.js ***!
  \****************************************************************/
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "Transaction": () => (/* binding */ Transaction)
/* harmony export */ });
/* harmony import */ var _address_index_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../address/index.js */ "./node_modules/ethers/lib.esm/address/address.js");
/* harmony import */ var _crypto_index_js__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! ../crypto/index.js */ "./node_modules/ethers/lib.esm/crypto/signature.js");
/* harmony import */ var _crypto_index_js__WEBPACK_IMPORTED_MODULE_7__ = __webpack_require__(/*! ../crypto/index.js */ "./node_modules/ethers/lib.esm/crypto/keccak.js");
/* harmony import */ var _crypto_index_js__WEBPACK_IMPORTED_MODULE_10__ = __webpack_require__(/*! ../crypto/index.js */ "./node_modules/ethers/lib.esm/crypto/signing-key.js");
/* harmony import */ var _utils_index_js__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ../utils/index.js */ "./node_modules/ethers/lib.esm/utils/errors.js");
/* harmony import */ var _utils_index_js__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ../utils/index.js */ "./node_modules/ethers/lib.esm/utils/maths.js");
/* harmony import */ var _utils_index_js__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ../utils/index.js */ "./node_modules/ethers/lib.esm/utils/rlp-decode.js");
/* harmony import */ var _utils_index_js__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! ../utils/index.js */ "./node_modules/ethers/lib.esm/utils/data.js");
/* harmony import */ var _utils_index_js__WEBPACK_IMPORTED_MODULE_8__ = __webpack_require__(/*! ../utils/index.js */ "./node_modules/ethers/lib.esm/utils/rlp-encode.js");
/* harmony import */ var _accesslist_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./accesslist.js */ "./node_modules/ethers/lib.esm/transaction/accesslist.js");
/* harmony import */ var _address_js__WEBPACK_IMPORTED_MODULE_9__ = __webpack_require__(/*! ./address.js */ "./node_modules/ethers/lib.esm/transaction/address.js");





const BN_0 = BigInt(0);
const BN_2 = BigInt(2);
const BN_27 = BigInt(27);
const BN_28 = BigInt(28);
const BN_35 = BigInt(35);
const BN_MAX_UINT = BigInt("0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff");
function handleAddress(value) {
    if (value === "0x") {
        return null;
    }
    return (0,_address_index_js__WEBPACK_IMPORTED_MODULE_0__.getAddress)(value);
}
function handleAccessList(value, param) {
    try {
        return (0,_accesslist_js__WEBPACK_IMPORTED_MODULE_1__.accessListify)(value);
    }
    catch (error) {
        (0,_utils_index_js__WEBPACK_IMPORTED_MODULE_2__.assertArgument)(false, error.message, param, value);
    }
}
function handleNumber(_value, param) {
    if (_value === "0x") {
        return 0;
    }
    return (0,_utils_index_js__WEBPACK_IMPORTED_MODULE_3__.getNumber)(_value, param);
}
function handleUint(_value, param) {
    if (_value === "0x") {
        return BN_0;
    }
    const value = (0,_utils_index_js__WEBPACK_IMPORTED_MODULE_3__.getBigInt)(_value, param);
    (0,_utils_index_js__WEBPACK_IMPORTED_MODULE_2__.assertArgument)(value <= BN_MAX_UINT, "value exceeds uint size", param, value);
    return value;
}
function formatNumber(_value, name) {
    const value = (0,_utils_index_js__WEBPACK_IMPORTED_MODULE_3__.getBigInt)(_value, "value");
    const result = (0,_utils_index_js__WEBPACK_IMPORTED_MODULE_3__.toBeArray)(value);
    (0,_utils_index_js__WEBPACK_IMPORTED_MODULE_2__.assertArgument)(result.length <= 32, `value too large`, `tx.${name}`, value);
    return result;
}
function formatAccessList(value) {
    return (0,_accesslist_js__WEBPACK_IMPORTED_MODULE_1__.accessListify)(value).map((set) => [set.address, set.storageKeys]);
}
function _parseLegacy(data) {
    const fields = (0,_utils_index_js__WEBPACK_IMPORTED_MODULE_4__.decodeRlp)(data);
    (0,_utils_index_js__WEBPACK_IMPORTED_MODULE_2__.assertArgument)(Array.isArray(fields) && (fields.length === 9 || fields.length === 6), "invalid field count for legacy transaction", "data", data);
    const tx = {
        type: 0,
        nonce: handleNumber(fields[0], "nonce"),
        gasPrice: handleUint(fields[1], "gasPrice"),
        gasLimit: handleUint(fields[2], "gasLimit"),
        to: handleAddress(fields[3]),
        value: handleUint(fields[4], "value"),
        data: (0,_utils_index_js__WEBPACK_IMPORTED_MODULE_5__.hexlify)(fields[5]),
        chainId: BN_0
    };
    // Legacy unsigned transaction
    if (fields.length === 6) {
        return tx;
    }
    const v = handleUint(fields[6], "v");
    const r = handleUint(fields[7], "r");
    const s = handleUint(fields[8], "s");
    if (r === BN_0 && s === BN_0) {
        // EIP-155 unsigned transaction
        tx.chainId = v;
    }
    else {
        // Compute the EIP-155 chain ID (or 0 for legacy)
        let chainId = (v - BN_35) / BN_2;
        if (chainId < BN_0) {
            chainId = BN_0;
        }
        tx.chainId = chainId;
        // Signed Legacy Transaction
        (0,_utils_index_js__WEBPACK_IMPORTED_MODULE_2__.assertArgument)(chainId !== BN_0 || (v === BN_27 || v === BN_28), "non-canonical legacy v", "v", fields[6]);
        tx.signature = _crypto_index_js__WEBPACK_IMPORTED_MODULE_6__.Signature.from({
            r: (0,_utils_index_js__WEBPACK_IMPORTED_MODULE_5__.zeroPadValue)(fields[7], 32),
            s: (0,_utils_index_js__WEBPACK_IMPORTED_MODULE_5__.zeroPadValue)(fields[8], 32),
            v
        });
        tx.hash = (0,_crypto_index_js__WEBPACK_IMPORTED_MODULE_7__.keccak256)(data);
    }
    return tx;
}
function _serializeLegacy(tx, sig) {
    const fields = [
        formatNumber(tx.nonce || 0, "nonce"),
        formatNumber(tx.gasPrice || 0, "gasPrice"),
        formatNumber(tx.gasLimit || 0, "gasLimit"),
        ((tx.to != null) ? (0,_address_index_js__WEBPACK_IMPORTED_MODULE_0__.getAddress)(tx.to) : "0x"),
        formatNumber(tx.value || 0, "value"),
        (tx.data || "0x"),
    ];
    let chainId = BN_0;
    if (tx.chainId != null) {
        // A chainId was provided; if non-zero we'll use EIP-155
        chainId = (0,_utils_index_js__WEBPACK_IMPORTED_MODULE_3__.getBigInt)(tx.chainId, "tx.chainId");
        // We have a chainId in the tx and an EIP-155 v in the signature,
        // make sure they agree with each other
        (0,_utils_index_js__WEBPACK_IMPORTED_MODULE_2__.assertArgument)(!sig || sig.networkV == null || sig.legacyChainId === chainId, "tx.chainId/sig.v mismatch", "sig", sig);
    }
    else if (sig) {
        // No chainId provided, but the signature is signing with EIP-155; derive chainId
        const legacy = sig.legacyChainId;
        if (legacy != null) {
            chainId = legacy;
        }
    }
    // Requesting an unsigned transaction
    if (!sig) {
        // We have an EIP-155 transaction (chainId was specified and non-zero)
        if (chainId !== BN_0) {
            fields.push((0,_utils_index_js__WEBPACK_IMPORTED_MODULE_3__.toBeArray)(chainId));
            fields.push("0x");
            fields.push("0x");
        }
        return (0,_utils_index_js__WEBPACK_IMPORTED_MODULE_8__.encodeRlp)(fields);
    }
    // We pushed a chainId and null r, s on for hashing only; remove those
    let v = BigInt(27 + sig.yParity);
    if (chainId !== BN_0) {
        v = _crypto_index_js__WEBPACK_IMPORTED_MODULE_6__.Signature.getChainIdV(chainId, sig.v);
    }
    else if (BigInt(sig.v) !== v) {
        (0,_utils_index_js__WEBPACK_IMPORTED_MODULE_2__.assertArgument)(false, "tx.chainId/sig.v mismatch", "sig", sig);
    }
    fields.push((0,_utils_index_js__WEBPACK_IMPORTED_MODULE_3__.toBeArray)(v));
    fields.push((0,_utils_index_js__WEBPACK_IMPORTED_MODULE_3__.toBeArray)(sig.r));
    fields.push((0,_utils_index_js__WEBPACK_IMPORTED_MODULE_3__.toBeArray)(sig.s));
    return (0,_utils_index_js__WEBPACK_IMPORTED_MODULE_8__.encodeRlp)(fields);
}
function _parseEipSignature(tx, fields, serialize) {
    let yParity;
    try {
        yParity = handleNumber(fields[0], "yParity");
        if (yParity !== 0 && yParity !== 1) {
            throw new Error("bad yParity");
        }
    }
    catch (error) {
        (0,_utils_index_js__WEBPACK_IMPORTED_MODULE_2__.assertArgument)(false, "invalid yParity", "yParity", fields[0]);
    }
    const r = (0,_utils_index_js__WEBPACK_IMPORTED_MODULE_5__.zeroPadValue)(fields[1], 32);
    const s = (0,_utils_index_js__WEBPACK_IMPORTED_MODULE_5__.zeroPadValue)(fields[2], 32);
    const signature = _crypto_index_js__WEBPACK_IMPORTED_MODULE_6__.Signature.from({ r, s, yParity });
    tx.signature = signature;
}
function _parseEip1559(data) {
    const fields = (0,_utils_index_js__WEBPACK_IMPORTED_MODULE_4__.decodeRlp)((0,_utils_index_js__WEBPACK_IMPORTED_MODULE_5__.getBytes)(data).slice(1));
    (0,_utils_index_js__WEBPACK_IMPORTED_MODULE_2__.assertArgument)(Array.isArray(fields) && (fields.length === 9 || fields.length === 12), "invalid field count for transaction type: 2", "data", (0,_utils_index_js__WEBPACK_IMPORTED_MODULE_5__.hexlify)(data));
    const maxPriorityFeePerGas = handleUint(fields[2], "maxPriorityFeePerGas");
    const maxFeePerGas = handleUint(fields[3], "maxFeePerGas");
    const tx = {
        type: 2,
        chainId: handleUint(fields[0], "chainId"),
        nonce: handleNumber(fields[1], "nonce"),
        maxPriorityFeePerGas: maxPriorityFeePerGas,
        maxFeePerGas: maxFeePerGas,
        gasPrice: null,
        gasLimit: handleUint(fields[4], "gasLimit"),
        to: handleAddress(fields[5]),
        value: handleUint(fields[6], "value"),
        data: (0,_utils_index_js__WEBPACK_IMPORTED_MODULE_5__.hexlify)(fields[7]),
        accessList: handleAccessList(fields[8], "accessList"),
    };
    // Unsigned EIP-1559 Transaction
    if (fields.length === 9) {
        return tx;
    }
    tx.hash = (0,_crypto_index_js__WEBPACK_IMPORTED_MODULE_7__.keccak256)(data);
    _parseEipSignature(tx, fields.slice(9), _serializeEip1559);
    return tx;
}
function _serializeEip1559(tx, sig) {
    const fields = [
        formatNumber(tx.chainId || 0, "chainId"),
        formatNumber(tx.nonce || 0, "nonce"),
        formatNumber(tx.maxPriorityFeePerGas || 0, "maxPriorityFeePerGas"),
        formatNumber(tx.maxFeePerGas || 0, "maxFeePerGas"),
        formatNumber(tx.gasLimit || 0, "gasLimit"),
        ((tx.to != null) ? (0,_address_index_js__WEBPACK_IMPORTED_MODULE_0__.getAddress)(tx.to) : "0x"),
        formatNumber(tx.value || 0, "value"),
        (tx.data || "0x"),
        (formatAccessList(tx.accessList || []))
    ];
    if (sig) {
        fields.push(formatNumber(sig.yParity, "yParity"));
        fields.push((0,_utils_index_js__WEBPACK_IMPORTED_MODULE_3__.toBeArray)(sig.r));
        fields.push((0,_utils_index_js__WEBPACK_IMPORTED_MODULE_3__.toBeArray)(sig.s));
    }
    return (0,_utils_index_js__WEBPACK_IMPORTED_MODULE_5__.concat)(["0x02", (0,_utils_index_js__WEBPACK_IMPORTED_MODULE_8__.encodeRlp)(fields)]);
}
function _parseEip2930(data) {
    const fields = (0,_utils_index_js__WEBPACK_IMPORTED_MODULE_4__.decodeRlp)((0,_utils_index_js__WEBPACK_IMPORTED_MODULE_5__.getBytes)(data).slice(1));
    (0,_utils_index_js__WEBPACK_IMPORTED_MODULE_2__.assertArgument)(Array.isArray(fields) && (fields.length === 8 || fields.length === 11), "invalid field count for transaction type: 1", "data", (0,_utils_index_js__WEBPACK_IMPORTED_MODULE_5__.hexlify)(data));
    const tx = {
        type: 1,
        chainId: handleUint(fields[0], "chainId"),
        nonce: handleNumber(fields[1], "nonce"),
        gasPrice: handleUint(fields[2], "gasPrice"),
        gasLimit: handleUint(fields[3], "gasLimit"),
        to: handleAddress(fields[4]),
        value: handleUint(fields[5], "value"),
        data: (0,_utils_index_js__WEBPACK_IMPORTED_MODULE_5__.hexlify)(fields[6]),
        accessList: handleAccessList(fields[7], "accessList")
    };
    // Unsigned EIP-2930 Transaction
    if (fields.length === 8) {
        return tx;
    }
    tx.hash = (0,_crypto_index_js__WEBPACK_IMPORTED_MODULE_7__.keccak256)(data);
    _parseEipSignature(tx, fields.slice(8), _serializeEip2930);
    return tx;
}
function _serializeEip2930(tx, sig) {
    const fields = [
        formatNumber(tx.chainId || 0, "chainId"),
        formatNumber(tx.nonce || 0, "nonce"),
        formatNumber(tx.gasPrice || 0, "gasPrice"),
        formatNumber(tx.gasLimit || 0, "gasLimit"),
        ((tx.to != null) ? (0,_address_index_js__WEBPACK_IMPORTED_MODULE_0__.getAddress)(tx.to) : "0x"),
        formatNumber(tx.value || 0, "value"),
        (tx.data || "0x"),
        (formatAccessList(tx.accessList || []))
    ];
    if (sig) {
        fields.push(formatNumber(sig.yParity, "recoveryParam"));
        fields.push((0,_utils_index_js__WEBPACK_IMPORTED_MODULE_3__.toBeArray)(sig.r));
        fields.push((0,_utils_index_js__WEBPACK_IMPORTED_MODULE_3__.toBeArray)(sig.s));
    }
    return (0,_utils_index_js__WEBPACK_IMPORTED_MODULE_5__.concat)(["0x01", (0,_utils_index_js__WEBPACK_IMPORTED_MODULE_8__.encodeRlp)(fields)]);
}
/**
 *  A **Transaction** describes an operation to be executed on
 *  Ethereum by an Externally Owned Account (EOA). It includes
 *  who (the [[to]] address), what (the [[data]]) and how much (the
 *  [[value]] in ether) the operation should entail.
 *
 *  @example:
 *    tx = new Transaction()
 *    //_result:
 *
 *    tx.data = "0x1234";
 *    //_result:
 */
class Transaction {
    #type;
    #to;
    #data;
    #nonce;
    #gasLimit;
    #gasPrice;
    #maxPriorityFeePerGas;
    #maxFeePerGas;
    #value;
    #chainId;
    #sig;
    #accessList;
    /**
     *  The transaction type.
     *
     *  If null, the type will be automatically inferred based on
     *  explicit properties.
     */
    get type() { return this.#type; }
    set type(value) {
        switch (value) {
            case null:
                this.#type = null;
                break;
            case 0:
            case "legacy":
                this.#type = 0;
                break;
            case 1:
            case "berlin":
            case "eip-2930":
                this.#type = 1;
                break;
            case 2:
            case "london":
            case "eip-1559":
                this.#type = 2;
                break;
            default:
                (0,_utils_index_js__WEBPACK_IMPORTED_MODULE_2__.assertArgument)(false, "unsupported transaction type", "type", value);
        }
    }
    /**
     *  The name of the transaction type.
     */
    get typeName() {
        switch (this.type) {
            case 0: return "legacy";
            case 1: return "eip-2930";
            case 2: return "eip-1559";
        }
        return null;
    }
    /**
     *  The ``to`` address for the transaction or ``null`` if the
     *  transaction is an ``init`` transaction.
     */
    get to() { return this.#to; }
    set to(value) {
        this.#to = (value == null) ? null : (0,_address_index_js__WEBPACK_IMPORTED_MODULE_0__.getAddress)(value);
    }
    /**
     *  The transaction nonce.
     */
    get nonce() { return this.#nonce; }
    set nonce(value) { this.#nonce = (0,_utils_index_js__WEBPACK_IMPORTED_MODULE_3__.getNumber)(value, "value"); }
    /**
     *  The gas limit.
     */
    get gasLimit() { return this.#gasLimit; }
    set gasLimit(value) { this.#gasLimit = (0,_utils_index_js__WEBPACK_IMPORTED_MODULE_3__.getBigInt)(value); }
    /**
     *  The gas price.
     *
     *  On legacy networks this defines the fee that will be paid. On
     *  EIP-1559 networks, this should be ``null``.
     */
    get gasPrice() {
        const value = this.#gasPrice;
        if (value == null && (this.type === 0 || this.type === 1)) {
            return BN_0;
        }
        return value;
    }
    set gasPrice(value) {
        this.#gasPrice = (value == null) ? null : (0,_utils_index_js__WEBPACK_IMPORTED_MODULE_3__.getBigInt)(value, "gasPrice");
    }
    /**
     *  The maximum priority fee per unit of gas to pay. On legacy
     *  networks this should be ``null``.
     */
    get maxPriorityFeePerGas() {
        const value = this.#maxPriorityFeePerGas;
        if (value == null) {
            if (this.type === 2) {
                return BN_0;
            }
            return null;
        }
        return value;
    }
    set maxPriorityFeePerGas(value) {
        this.#maxPriorityFeePerGas = (value == null) ? null : (0,_utils_index_js__WEBPACK_IMPORTED_MODULE_3__.getBigInt)(value, "maxPriorityFeePerGas");
    }
    /**
     *  The maximum total fee per unit of gas to pay. On legacy
     *  networks this should be ``null``.
     */
    get maxFeePerGas() {
        const value = this.#maxFeePerGas;
        if (value == null) {
            if (this.type === 2) {
                return BN_0;
            }
            return null;
        }
        return value;
    }
    set maxFeePerGas(value) {
        this.#maxFeePerGas = (value == null) ? null : (0,_utils_index_js__WEBPACK_IMPORTED_MODULE_3__.getBigInt)(value, "maxFeePerGas");
    }
    /**
     *  The transaction data. For ``init`` transactions this is the
     *  deployment code.
     */
    get data() { return this.#data; }
    set data(value) { this.#data = (0,_utils_index_js__WEBPACK_IMPORTED_MODULE_5__.hexlify)(value); }
    /**
     *  The amount of ether to send in this transactions.
     */
    get value() { return this.#value; }
    set value(value) {
        this.#value = (0,_utils_index_js__WEBPACK_IMPORTED_MODULE_3__.getBigInt)(value, "value");
    }
    /**
     *  The chain ID this transaction is valid on.
     */
    get chainId() { return this.#chainId; }
    set chainId(value) { this.#chainId = (0,_utils_index_js__WEBPACK_IMPORTED_MODULE_3__.getBigInt)(value); }
    /**
     *  If signed, the signature for this transaction.
     */
    get signature() { return this.#sig || null; }
    set signature(value) {
        this.#sig = (value == null) ? null : _crypto_index_js__WEBPACK_IMPORTED_MODULE_6__.Signature.from(value);
    }
    /**
     *  The access list.
     *
     *  An access list permits discounted (but pre-paid) access to
     *  bytecode and state variable access within contract execution.
     */
    get accessList() {
        const value = this.#accessList || null;
        if (value == null) {
            if (this.type === 1 || this.type === 2) {
                return [];
            }
            return null;
        }
        return value;
    }
    set accessList(value) {
        this.#accessList = (value == null) ? null : (0,_accesslist_js__WEBPACK_IMPORTED_MODULE_1__.accessListify)(value);
    }
    /**
     *  Creates a new Transaction with default values.
     */
    constructor() {
        this.#type = null;
        this.#to = null;
        this.#nonce = 0;
        this.#gasLimit = BigInt(0);
        this.#gasPrice = null;
        this.#maxPriorityFeePerGas = null;
        this.#maxFeePerGas = null;
        this.#data = "0x";
        this.#value = BigInt(0);
        this.#chainId = BigInt(0);
        this.#sig = null;
        this.#accessList = null;
    }
    /**
     *  The transaction hash, if signed. Otherwise, ``null``.
     */
    get hash() {
        if (this.signature == null) {
            return null;
        }
        return (0,_crypto_index_js__WEBPACK_IMPORTED_MODULE_7__.keccak256)(this.serialized);
    }
    /**
     *  The pre-image hash of this transaction.
     *
     *  This is the digest that a [[Signer]] must sign to authorize
     *  this transaction.
     */
    get unsignedHash() {
        return (0,_crypto_index_js__WEBPACK_IMPORTED_MODULE_7__.keccak256)(this.unsignedSerialized);
    }
    /**
     *  The sending address, if signed. Otherwise, ``null``.
     */
    get from() {
        if (this.signature == null) {
            return null;
        }
        return (0,_address_js__WEBPACK_IMPORTED_MODULE_9__.recoverAddress)(this.unsignedHash, this.signature);
    }
    /**
     *  The public key of the sender, if signed. Otherwise, ``null``.
     */
    get fromPublicKey() {
        if (this.signature == null) {
            return null;
        }
        return _crypto_index_js__WEBPACK_IMPORTED_MODULE_10__.SigningKey.recoverPublicKey(this.unsignedHash, this.signature);
    }
    /**
     *  Returns true if signed.
     *
     *  This provides a Type Guard that properties requiring a signed
     *  transaction are non-null.
     */
    isSigned() {
        //isSigned(): this is SignedTransaction {
        return this.signature != null;
    }
    /**
     *  The serialized transaction.
     *
     *  This throws if the transaction is unsigned. For the pre-image,
     *  use [[unsignedSerialized]].
     */
    get serialized() {
        (0,_utils_index_js__WEBPACK_IMPORTED_MODULE_2__.assert)(this.signature != null, "cannot serialize unsigned transaction; maybe you meant .unsignedSerialized", "UNSUPPORTED_OPERATION", { operation: ".serialized" });
        switch (this.inferType()) {
            case 0:
                return _serializeLegacy(this, this.signature);
            case 1:
                return _serializeEip2930(this, this.signature);
            case 2:
                return _serializeEip1559(this, this.signature);
        }
        (0,_utils_index_js__WEBPACK_IMPORTED_MODULE_2__.assert)(false, "unsupported transaction type", "UNSUPPORTED_OPERATION", { operation: ".serialized" });
    }
    /**
     *  The transaction pre-image.
     *
     *  The hash of this is the digest which needs to be signed to
     *  authorize this transaction.
     */
    get unsignedSerialized() {
        switch (this.inferType()) {
            case 0:
                return _serializeLegacy(this);
            case 1:
                return _serializeEip2930(this);
            case 2:
                return _serializeEip1559(this);
        }
        (0,_utils_index_js__WEBPACK_IMPORTED_MODULE_2__.assert)(false, "unsupported transaction type", "UNSUPPORTED_OPERATION", { operation: ".unsignedSerialized" });
    }
    /**
     *  Return the most "likely" type; currently the highest
     *  supported transaction type.
     */
    inferType() {
        return (this.inferTypes().pop());
    }
    /**
     *  Validates the explicit properties and returns a list of compatible
     *  transaction types.
     */
    inferTypes() {
        // Checks that there are no conflicting properties set
        const hasGasPrice = this.gasPrice != null;
        const hasFee = (this.maxFeePerGas != null || this.maxPriorityFeePerGas != null);
        const hasAccessList = (this.accessList != null);
        //if (hasGasPrice && hasFee) {
        //    throw new Error("transaction cannot have gasPrice and maxFeePerGas");
        //}
        if (this.maxFeePerGas != null && this.maxPriorityFeePerGas != null) {
            (0,_utils_index_js__WEBPACK_IMPORTED_MODULE_2__.assert)(this.maxFeePerGas >= this.maxPriorityFeePerGas, "priorityFee cannot be more than maxFee", "BAD_DATA", { value: this });
        }
        //if (this.type === 2 && hasGasPrice) {
        //    throw new Error("eip-1559 transaction cannot have gasPrice");
        //}
        (0,_utils_index_js__WEBPACK_IMPORTED_MODULE_2__.assert)(!hasFee || (this.type !== 0 && this.type !== 1), "transaction type cannot have maxFeePerGas or maxPriorityFeePerGas", "BAD_DATA", { value: this });
        (0,_utils_index_js__WEBPACK_IMPORTED_MODULE_2__.assert)(this.type !== 0 || !hasAccessList, "legacy transaction cannot have accessList", "BAD_DATA", { value: this });
        const types = [];
        // Explicit type
        if (this.type != null) {
            types.push(this.type);
        }
        else {
            if (hasFee) {
                types.push(2);
            }
            else if (hasGasPrice) {
                types.push(1);
                if (!hasAccessList) {
                    types.push(0);
                }
            }
            else if (hasAccessList) {
                types.push(1);
                types.push(2);
            }
            else {
                types.push(0);
                types.push(1);
                types.push(2);
            }
        }
        types.sort();
        return types;
    }
    /**
     *  Returns true if this transaction is a legacy transaction (i.e.
     *  ``type === 0``).
     *
     *  This provides a Type Guard that the related properties are
     *  non-null.
     */
    isLegacy() {
        return (this.type === 0);
    }
    /**
     *  Returns true if this transaction is berlin hardform transaction (i.e.
     *  ``type === 1``).
     *
     *  This provides a Type Guard that the related properties are
     *  non-null.
     */
    isBerlin() {
        return (this.type === 1);
    }
    /**
     *  Returns true if this transaction is london hardform transaction (i.e.
     *  ``type === 2``).
     *
     *  This provides a Type Guard that the related properties are
     *  non-null.
     */
    isLondon() {
        return (this.type === 2);
    }
    /**
     *  Create a copy of this transaciton.
     */
    clone() {
        return Transaction.from(this);
    }
    /**
     *  Return a JSON-friendly object.
     */
    toJSON() {
        const s = (v) => {
            if (v == null) {
                return null;
            }
            return v.toString();
        };
        return {
            type: this.type,
            to: this.to,
            //            from: this.from,
            data: this.data,
            nonce: this.nonce,
            gasLimit: s(this.gasLimit),
            gasPrice: s(this.gasPrice),
            maxPriorityFeePerGas: s(this.maxPriorityFeePerGas),
            maxFeePerGas: s(this.maxFeePerGas),
            value: s(this.value),
            chainId: s(this.chainId),
            sig: this.signature ? this.signature.toJSON() : null,
            accessList: this.accessList
        };
    }
    /**
     *  Create a **Transaction** from a serialized transaction or a
     *  Transaction-like object.
     */
    static from(tx) {
        if (tx == null) {
            return new Transaction();
        }
        if (typeof (tx) === "string") {
            const payload = (0,_utils_index_js__WEBPACK_IMPORTED_MODULE_5__.getBytes)(tx);
            if (payload[0] >= 0x7f) { // @TODO: > vs >= ??
                return Transaction.from(_parseLegacy(payload));
            }
            switch (payload[0]) {
                case 1: return Transaction.from(_parseEip2930(payload));
                case 2: return Transaction.from(_parseEip1559(payload));
            }
            (0,_utils_index_js__WEBPACK_IMPORTED_MODULE_2__.assert)(false, "unsupported transaction type", "UNSUPPORTED_OPERATION", { operation: "from" });
        }
        const result = new Transaction();
        if (tx.type != null) {
            result.type = tx.type;
        }
        if (tx.to != null) {
            result.to = tx.to;
        }
        if (tx.nonce != null) {
            result.nonce = tx.nonce;
        }
        if (tx.gasLimit != null) {
            result.gasLimit = tx.gasLimit;
        }
        if (tx.gasPrice != null) {
            result.gasPrice = tx.gasPrice;
        }
        if (tx.maxPriorityFeePerGas != null) {
            result.maxPriorityFeePerGas = tx.maxPriorityFeePerGas;
        }
        if (tx.maxFeePerGas != null) {
            result.maxFeePerGas = tx.maxFeePerGas;
        }
        if (tx.data != null) {
            result.data = tx.data;
        }
        if (tx.value != null) {
            result.value = tx.value;
        }
        if (tx.chainId != null) {
            result.chainId = tx.chainId;
        }
        if (tx.signature != null) {
            result.signature = _crypto_index_js__WEBPACK_IMPORTED_MODULE_6__.Signature.from(tx.signature);
        }
        if (tx.accessList != null) {
            result.accessList = tx.accessList;
        }
        if (tx.hash != null) {
            (0,_utils_index_js__WEBPACK_IMPORTED_MODULE_2__.assertArgument)(result.isSigned(), "unsigned transaction cannot define hash", "tx", tx);
            (0,_utils_index_js__WEBPACK_IMPORTED_MODULE_2__.assertArgument)(result.hash === tx.hash, "hash mismatch", "tx", tx);
        }
        if (tx.from != null) {
            (0,_utils_index_js__WEBPACK_IMPORTED_MODULE_2__.assertArgument)(result.isSigned(), "unsigned transaction cannot define from", "tx", tx);
            (0,_utils_index_js__WEBPACK_IMPORTED_MODULE_2__.assertArgument)(result.from.toLowerCase() === (tx.from || "").toLowerCase(), "from mismatch", "tx", tx);
        }
        return result;
    }
}
//# sourceMappingURL=transaction.js.map

/***/ }),

/***/ "./node_modules/ethers/lib.esm/utils/base58.js":
/*!*****************************************************!*\
  !*** ./node_modules/ethers/lib.esm/utils/base58.js ***!
  \*****************************************************/
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "decodeBase58": () => (/* binding */ decodeBase58),
/* harmony export */   "encodeBase58": () => (/* binding */ encodeBase58)
/* harmony export */ });
/* harmony import */ var _data_js__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./data.js */ "./node_modules/ethers/lib.esm/utils/data.js");
/* harmony import */ var _errors_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./errors.js */ "./node_modules/ethers/lib.esm/utils/errors.js");
/* harmony import */ var _maths_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./maths.js */ "./node_modules/ethers/lib.esm/utils/maths.js");
/**
 *  The [Base58 Encoding](link-base58) scheme allows a **numeric** value
 *  to be encoded as a compact string using a radix of 58 using only
 *  alpha-numeric characters. Confusingly similar characters are omitted
 *  (i.e. ``"l0O"``).
 *
 *  Note that Base58 encodes a **numeric** value, not arbitrary bytes,
 *  since any zero-bytes on the left would get removed. To mitigate this
 *  issue most schemes that use Base58 choose specific high-order values
 *  to ensure non-zero prefixes.
 *
 *  @_subsection: api/utils:Base58 Encoding [about-base58]
 */



const Alphabet = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";
let Lookup = null;
function getAlpha(letter) {
    if (Lookup == null) {
        Lookup = {};
        for (let i = 0; i < Alphabet.length; i++) {
            Lookup[Alphabet[i]] = BigInt(i);
        }
    }
    const result = Lookup[letter];
    (0,_errors_js__WEBPACK_IMPORTED_MODULE_0__.assertArgument)(result != null, `invalid base58 value`, "letter", letter);
    return result;
}
const BN_0 = BigInt(0);
const BN_58 = BigInt(58);
/**
 *  Encode %%value%% as a Base58-encoded string.
 */
function encodeBase58(_value) {
    let value = (0,_maths_js__WEBPACK_IMPORTED_MODULE_1__.toBigInt)((0,_data_js__WEBPACK_IMPORTED_MODULE_2__.getBytes)(_value));
    let result = "";
    while (value) {
        result = Alphabet[Number(value % BN_58)] + result;
        value /= BN_58;
    }
    return result;
}
/**
 *  Decode the Base58-encoded %%value%%.
 */
function decodeBase58(value) {
    let result = BN_0;
    for (let i = 0; i < value.length; i++) {
        result *= BN_58;
        result += getAlpha(value[i]);
    }
    return result;
}
//# sourceMappingURL=base58.js.map

/***/ }),

/***/ "./node_modules/ethers/lib.esm/utils/base64-browser.js":
/*!*************************************************************!*\
  !*** ./node_modules/ethers/lib.esm/utils/base64-browser.js ***!
  \*************************************************************/
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "decodeBase64": () => (/* binding */ decodeBase64),
/* harmony export */   "encodeBase64": () => (/* binding */ encodeBase64)
/* harmony export */ });
/* harmony import */ var _data_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./data.js */ "./node_modules/ethers/lib.esm/utils/data.js");
// utils/base64-browser

function decodeBase64(textData) {
    textData = atob(textData);
    const data = new Uint8Array(textData.length);
    for (let i = 0; i < textData.length; i++) {
        data[i] = textData.charCodeAt(i);
    }
    return (0,_data_js__WEBPACK_IMPORTED_MODULE_0__.getBytes)(data);
}
function encodeBase64(_data) {
    const data = (0,_data_js__WEBPACK_IMPORTED_MODULE_0__.getBytes)(_data);
    let textData = "";
    for (let i = 0; i < data.length; i++) {
        textData += String.fromCharCode(data[i]);
    }
    return btoa(textData);
}
//# sourceMappingURL=base64-browser.js.map

/***/ }),

/***/ "./node_modules/ethers/lib.esm/utils/data.js":
/*!***************************************************!*\
  !*** ./node_modules/ethers/lib.esm/utils/data.js ***!
  \***************************************************/
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "concat": () => (/* binding */ concat),
/* harmony export */   "dataLength": () => (/* binding */ dataLength),
/* harmony export */   "dataSlice": () => (/* binding */ dataSlice),
/* harmony export */   "getBytes": () => (/* binding */ getBytes),
/* harmony export */   "getBytesCopy": () => (/* binding */ getBytesCopy),
/* harmony export */   "hexlify": () => (/* binding */ hexlify),
/* harmony export */   "isBytesLike": () => (/* binding */ isBytesLike),
/* harmony export */   "isHexString": () => (/* binding */ isHexString),
/* harmony export */   "stripZerosLeft": () => (/* binding */ stripZerosLeft),
/* harmony export */   "zeroPadBytes": () => (/* binding */ zeroPadBytes),
/* harmony export */   "zeroPadValue": () => (/* binding */ zeroPadValue)
/* harmony export */ });
/* harmony import */ var _errors_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./errors.js */ "./node_modules/ethers/lib.esm/utils/errors.js");
/**
 *  Some data helpers.
 *
 *
 *  @_subsection api/utils:Data Helpers  [about-data]
 */

function _getBytes(value, name, copy) {
    if (value instanceof Uint8Array) {
        if (copy) {
            return new Uint8Array(value);
        }
        return value;
    }
    if (typeof (value) === "string" && value.match(/^0x([0-9a-f][0-9a-f])*$/i)) {
        const result = new Uint8Array((value.length - 2) / 2);
        let offset = 2;
        for (let i = 0; i < result.length; i++) {
            result[i] = parseInt(value.substring(offset, offset + 2), 16);
            offset += 2;
        }
        return result;
    }
    (0,_errors_js__WEBPACK_IMPORTED_MODULE_0__.assertArgument)(false, "invalid BytesLike value", name || "value", value);
}
/**
 *  Get a typed Uint8Array for %%value%%. If already a Uint8Array
 *  the original %%value%% is returned; if a copy is required use
 *  [[getBytesCopy]].
 *
 *  @see: getBytesCopy
 */
function getBytes(value, name) {
    return _getBytes(value, name, false);
}
/**
 *  Get a typed Uint8Array for %%value%%, creating a copy if necessary
 *  to prevent any modifications of the returned value from being
 *  reflected elsewhere.
 *
 *  @see: getBytes
 */
function getBytesCopy(value, name) {
    return _getBytes(value, name, true);
}
/**
 *  Returns true if %%value%% is a valid [[HexString]].
 *
 *  If %%length%% is ``true`` or a //number//, it also checks that
 *  %%value%% is a valid [[DataHexString]] of %%length%% (if a //number//)
 *  bytes of data (e.g. ``0x1234`` is 2 bytes).
 */
function isHexString(value, length) {
    if (typeof (value) !== "string" || !value.match(/^0x[0-9A-Fa-f]*$/)) {
        return false;
    }
    if (typeof (length) === "number" && value.length !== 2 + 2 * length) {
        return false;
    }
    if (length === true && (value.length % 2) !== 0) {
        return false;
    }
    return true;
}
/**
 *  Returns true if %%value%% is a valid representation of arbitrary
 *  data (i.e. a valid [[DataHexString]] or a Uint8Array).
 */
function isBytesLike(value) {
    return (isHexString(value, true) || (value instanceof Uint8Array));
}
const HexCharacters = "0123456789abcdef";
/**
 *  Returns a [[DataHexString]] representation of %%data%%.
 */
function hexlify(data) {
    const bytes = getBytes(data);
    let result = "0x";
    for (let i = 0; i < bytes.length; i++) {
        const v = bytes[i];
        result += HexCharacters[(v & 0xf0) >> 4] + HexCharacters[v & 0x0f];
    }
    return result;
}
/**
 *  Returns a [[DataHexString]] by concatenating all values
 *  within %%data%%.
 */
function concat(datas) {
    return "0x" + datas.map((d) => hexlify(d).substring(2)).join("");
}
/**
 *  Returns the length of %%data%%, in bytes.
 */
function dataLength(data) {
    if (isHexString(data, true)) {
        return (data.length - 2) / 2;
    }
    return getBytes(data).length;
}
/**
 *  Returns a [[DataHexString]] by slicing %%data%% from the %%start%%
 *  offset to the %%end%% offset.
 *
 *  By default %%start%% is 0 and %%end%% is the length of %%data%%.
 */
function dataSlice(data, start, end) {
    const bytes = getBytes(data);
    if (end != null && end > bytes.length) {
        (0,_errors_js__WEBPACK_IMPORTED_MODULE_0__.assert)(false, "cannot slice beyond data bounds", "BUFFER_OVERRUN", {
            buffer: bytes, length: bytes.length, offset: end
        });
    }
    return hexlify(bytes.slice((start == null) ? 0 : start, (end == null) ? bytes.length : end));
}
/**
 *  Return the [[DataHexString]] result by stripping all **leading**
 ** zero bytes from %%data%%.
 */
function stripZerosLeft(data) {
    let bytes = hexlify(data).substring(2);
    while (bytes.startsWith("00")) {
        bytes = bytes.substring(2);
    }
    return "0x" + bytes;
}
function zeroPad(data, length, left) {
    const bytes = getBytes(data);
    (0,_errors_js__WEBPACK_IMPORTED_MODULE_0__.assert)(length >= bytes.length, "padding exceeds data length", "BUFFER_OVERRUN", {
        buffer: new Uint8Array(bytes),
        length: length,
        offset: length + 1
    });
    const result = new Uint8Array(length);
    result.fill(0);
    if (left) {
        result.set(bytes, length - bytes.length);
    }
    else {
        result.set(bytes, 0);
    }
    return hexlify(result);
}
/**
 *  Return the [[DataHexString]] of %%data%% padded on the **left**
 *  to %%length%% bytes.
 *
 *  If %%data%% already exceeds %%length%%, a [[BufferOverrunError]] is
 *  thrown.
 *
 *  This pads data the same as **values** are in Solidity
 *  (e.g. ``uint128``).
 */
function zeroPadValue(data, length) {
    return zeroPad(data, length, true);
}
/**
 *  Return the [[DataHexString]] of %%data%% padded on the **right**
 *  to %%length%% bytes.
 *
 *  If %%data%% already exceeds %%length%%, a [[BufferOverrunError]] is
 *  thrown.
 *
 *  This pads data the same as **bytes** are in Solidity
 *  (e.g. ``bytes16``).
 */
function zeroPadBytes(data, length) {
    return zeroPad(data, length, false);
}
//# sourceMappingURL=data.js.map

/***/ }),

/***/ "./node_modules/ethers/lib.esm/utils/errors.js":
/*!*****************************************************!*\
  !*** ./node_modules/ethers/lib.esm/utils/errors.js ***!
  \*****************************************************/
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "assert": () => (/* binding */ assert),
/* harmony export */   "assertArgument": () => (/* binding */ assertArgument),
/* harmony export */   "assertArgumentCount": () => (/* binding */ assertArgumentCount),
/* harmony export */   "assertNormalize": () => (/* binding */ assertNormalize),
/* harmony export */   "assertPrivate": () => (/* binding */ assertPrivate),
/* harmony export */   "isCallException": () => (/* binding */ isCallException),
/* harmony export */   "isError": () => (/* binding */ isError),
/* harmony export */   "makeError": () => (/* binding */ makeError)
/* harmony export */ });
/* harmony import */ var _version_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../_version.js */ "./node_modules/ethers/lib.esm/_version.js");
/* harmony import */ var _properties_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./properties.js */ "./node_modules/ethers/lib.esm/utils/properties.js");
/**
 *  About Errors.
 *
 *  @_section: api/utils/errors:Errors  [about-errors]
 */


function stringify(value) {
    if (value == null) {
        return "null";
    }
    if (Array.isArray(value)) {
        return "[ " + (value.map(stringify)).join(", ") + " ]";
    }
    if (value instanceof Uint8Array) {
        const HEX = "0123456789abcdef";
        let result = "0x";
        for (let i = 0; i < value.length; i++) {
            result += HEX[value[i] >> 4];
            result += HEX[value[i] & 0xf];
        }
        return result;
    }
    if (typeof (value) === "object" && typeof (value.toJSON) === "function") {
        return stringify(value.toJSON());
    }
    switch (typeof (value)) {
        case "boolean":
        case "symbol":
            return value.toString();
        case "bigint":
            return BigInt(value).toString();
        case "number":
            return (value).toString();
        case "string":
            return JSON.stringify(value);
        case "object": {
            const keys = Object.keys(value);
            keys.sort();
            return "{ " + keys.map((k) => `${stringify(k)}: ${stringify(value[k])}`).join(", ") + " }";
        }
    }
    return `[ COULD NOT SERIALIZE ]`;
}
/**
 *  Returns true if the %%error%% matches an error thrown by ethers
 *  that matches the error %%code%%.
 *
 *  In TypeScript envornoments, this can be used to check that %%error%%
 *  matches an EthersError type, which means the expected properties will
 *  be set.
 *
 *  @See [ErrorCodes](api:ErrorCode)
 *  @example
 *    try {
 *      // code....
 *    } catch (e) {
 *      if (isError(e, "CALL_EXCEPTION")) {
 *          // The Type Guard has validated this object
 *          console.log(e.data);
 *      }
 *    }
 */
function isError(error, code) {
    return (error && error.code === code);
}
/**
 *  Returns true if %%error%% is a [[CallExceptionError].
 */
function isCallException(error) {
    return isError(error, "CALL_EXCEPTION");
}
/**
 *  Returns a new Error configured to the format ethers emits errors, with
 *  the %%message%%, [[api:ErrorCode]] %%code%% and additioanl properties
 *  for the corresponding EthersError.
 *
 *  Each error in ethers includes the version of ethers, a
 *  machine-readable [[ErrorCode]], and depneding on %%code%%, additional
 *  required properties. The error message will also include the %%meeage%%,
 *  ethers version, %%code%% and all aditional properties, serialized.
 */
function makeError(message, code, info) {
    {
        const details = [];
        if (info) {
            if ("message" in info || "code" in info || "name" in info) {
                throw new Error(`value will overwrite populated values: ${stringify(info)}`);
            }
            for (const key in info) {
                const value = (info[key]);
                //                try {
                details.push(key + "=" + stringify(value));
                //                } catch (error: any) {
                //                console.log("MMM", error.message);
                //                    details.push(key + "=[could not serialize object]");
                //                }
            }
        }
        details.push(`code=${code}`);
        details.push(`version=${_version_js__WEBPACK_IMPORTED_MODULE_0__.version}`);
        if (details.length) {
            message += " (" + details.join(", ") + ")";
        }
    }
    let error;
    switch (code) {
        case "INVALID_ARGUMENT":
            error = new TypeError(message);
            break;
        case "NUMERIC_FAULT":
        case "BUFFER_OVERRUN":
            error = new RangeError(message);
            break;
        default:
            error = new Error(message);
    }
    (0,_properties_js__WEBPACK_IMPORTED_MODULE_1__.defineProperties)(error, { code });
    if (info) {
        Object.assign(error, info);
    }
    return error;
}
/**
 *  Throws an EthersError with %%message%%, %%code%% and additional error
 *  %%info%% when %%check%% is falsish..
 *
 *  @see [[api:makeError]]
 */
function assert(check, message, code, info) {
    if (!check) {
        throw makeError(message, code, info);
    }
}
/**
 *  A simple helper to simply ensuring provided arguments match expected
 *  constraints, throwing if not.
 *
 *  In TypeScript environments, the %%check%% has been asserted true, so
 *  any further code does not need additional compile-time checks.
 */
function assertArgument(check, message, name, value) {
    assert(check, message, "INVALID_ARGUMENT", { argument: name, value: value });
}
function assertArgumentCount(count, expectedCount, message) {
    if (message == null) {
        message = "";
    }
    if (message) {
        message = ": " + message;
    }
    assert(count >= expectedCount, "missing arguemnt" + message, "MISSING_ARGUMENT", {
        count: count,
        expectedCount: expectedCount
    });
    assert(count <= expectedCount, "too many arguemnts" + message, "UNEXPECTED_ARGUMENT", {
        count: count,
        expectedCount: expectedCount
    });
}
const _normalizeForms = ["NFD", "NFC", "NFKD", "NFKC"].reduce((accum, form) => {
    try {
        // General test for normalize
        /* c8 ignore start */
        if ("test".normalize(form) !== "test") {
            throw new Error("bad");
        }
        ;
        /* c8 ignore stop */
        if (form === "NFD") {
            const check = String.fromCharCode(0xe9).normalize("NFD");
            const expected = String.fromCharCode(0x65, 0x0301);
            /* c8 ignore start */
            if (check !== expected) {
                throw new Error("broken");
            }
            /* c8 ignore stop */
        }
        accum.push(form);
    }
    catch (error) { }
    return accum;
}, []);
/**
 *  Throws if the normalization %%form%% is not supported.
 */
function assertNormalize(form) {
    assert(_normalizeForms.indexOf(form) >= 0, "platform missing String.prototype.normalize", "UNSUPPORTED_OPERATION", {
        operation: "String.prototype.normalize", info: { form }
    });
}
/**
 *  Many classes use file-scoped values to guard the constructor,
 *  making it effectively private. This facilitates that pattern
 *  by ensuring the %%givenGaurd%% matches the file-scoped %%guard%%,
 *  throwing if not, indicating the %%className%% if provided.
 */
function assertPrivate(givenGuard, guard, className) {
    if (className == null) {
        className = "";
    }
    if (givenGuard !== guard) {
        let method = className, operation = "new";
        if (className) {
            method += ".";
            operation += " " + className;
        }
        assert(false, `private constructor; use ${method}from* methods`, "UNSUPPORTED_OPERATION", {
            operation
        });
    }
}
//# sourceMappingURL=errors.js.map

/***/ }),

/***/ "./node_modules/ethers/lib.esm/utils/events.js":
/*!*****************************************************!*\
  !*** ./node_modules/ethers/lib.esm/utils/events.js ***!
  \*****************************************************/
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "EventPayload": () => (/* binding */ EventPayload)
/* harmony export */ });
/* harmony import */ var _properties_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./properties.js */ "./node_modules/ethers/lib.esm/utils/properties.js");
/**
 *  Explain events...
 *
 *  @_section api/utils/events:Events  [about-events]
 */

/**
 *  When an [[EventEmitterable]] triggers a [[Listener]], the
 *  callback always ahas one additional argument passed, which is
 *  an **EventPayload**.
 */
class EventPayload {
    /**
     *  The event filter.
     */
    filter;
    /**
     *  The **EventEmitterable**.
     */
    emitter;
    #listener;
    /**
     *  Create a new **EventPayload** for %%emitter%% with
     *  the %%listener%% and for %%filter%%.
     */
    constructor(emitter, listener, filter) {
        this.#listener = listener;
        (0,_properties_js__WEBPACK_IMPORTED_MODULE_0__.defineProperties)(this, { emitter, filter });
    }
    /**
     *  Unregister the triggered listener for future events.
     */
    async removeListener() {
        if (this.#listener == null) {
            return;
        }
        await this.emitter.off(this.filter, this.#listener);
    }
}
//# sourceMappingURL=events.js.map

/***/ }),

/***/ "./node_modules/ethers/lib.esm/utils/fetch.js":
/*!****************************************************!*\
  !*** ./node_modules/ethers/lib.esm/utils/fetch.js ***!
  \****************************************************/
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "FetchCancelSignal": () => (/* binding */ FetchCancelSignal),
/* harmony export */   "FetchRequest": () => (/* binding */ FetchRequest),
/* harmony export */   "FetchResponse": () => (/* binding */ FetchResponse)
/* harmony export */ });
/* harmony import */ var _base64_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./base64.js */ "./node_modules/ethers/lib.esm/utils/base64-browser.js");
/* harmony import */ var _data_js__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ./data.js */ "./node_modules/ethers/lib.esm/utils/data.js");
/* harmony import */ var _errors_js__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./errors.js */ "./node_modules/ethers/lib.esm/utils/errors.js");
/* harmony import */ var _properties_js__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! ./properties.js */ "./node_modules/ethers/lib.esm/utils/properties.js");
/* harmony import */ var _utf8_js__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./utf8.js */ "./node_modules/ethers/lib.esm/utils/utf8.js");
/* harmony import */ var _geturl_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./geturl.js */ "./node_modules/ethers/lib.esm/utils/geturl-browser.js");
/**
 *  Explain fetching here...
 *
 *  @_section api/utils/fetching:Fetching Web Content  [about-fetch]
 */






const MAX_ATTEMPTS = 12;
const SLOT_INTERVAL = 250;
// The global FetchGetUrlFunc implementation.
let getUrlFunc = _geturl_js__WEBPACK_IMPORTED_MODULE_0__.getUrl;
const reData = new RegExp("^data:([^;:]*)?(;base64)?,(.*)$", "i");
const reIpfs = new RegExp("^ipfs:/\/(ipfs/)?(.*)$", "i");
// If locked, new Gateways cannot be added
let locked = false;
// https://developer.mozilla.org/en-US/docs/Web/HTTP/Basics_of_HTTP/Data_URLs
async function dataGatewayFunc(url, signal) {
    try {
        const match = url.match(reData);
        if (!match) {
            throw new Error("invalid data");
        }
        return new FetchResponse(200, "OK", {
            "content-type": (match[1] || "text/plain"),
        }, (match[2] ? (0,_base64_js__WEBPACK_IMPORTED_MODULE_1__.decodeBase64)(match[3]) : unpercent(match[3])));
    }
    catch (error) {
        return new FetchResponse(599, "BAD REQUEST (invalid data: URI)", {}, null, new FetchRequest(url));
    }
}
/**
 *  Returns a [[FetchGatewayFunc]] for fetching content from a standard
 *  IPFS gateway hosted at %%baseUrl%%.
 */
function getIpfsGatewayFunc(baseUrl) {
    async function gatewayIpfs(url, signal) {
        try {
            const match = url.match(reIpfs);
            if (!match) {
                throw new Error("invalid link");
            }
            return new FetchRequest(`${baseUrl}${match[2]}`);
        }
        catch (error) {
            return new FetchResponse(599, "BAD REQUEST (invalid IPFS URI)", {}, null, new FetchRequest(url));
        }
    }
    return gatewayIpfs;
}
const Gateways = {
    "data": dataGatewayFunc,
    "ipfs": getIpfsGatewayFunc("https:/\/gateway.ipfs.io/ipfs/")
};
const fetchSignals = new WeakMap();
/**
 *  @_ignore
 */
class FetchCancelSignal {
    #listeners;
    #cancelled;
    constructor(request) {
        this.#listeners = [];
        this.#cancelled = false;
        fetchSignals.set(request, () => {
            if (this.#cancelled) {
                return;
            }
            this.#cancelled = true;
            for (const listener of this.#listeners) {
                setTimeout(() => { listener(); }, 0);
            }
            this.#listeners = [];
        });
    }
    addListener(listener) {
        (0,_errors_js__WEBPACK_IMPORTED_MODULE_2__.assert)(!this.#cancelled, "singal already cancelled", "UNSUPPORTED_OPERATION", {
            operation: "fetchCancelSignal.addCancelListener"
        });
        this.#listeners.push(listener);
    }
    get cancelled() { return this.#cancelled; }
    checkSignal() {
        (0,_errors_js__WEBPACK_IMPORTED_MODULE_2__.assert)(!this.cancelled, "cancelled", "CANCELLED", {});
    }
}
// Check the signal, throwing if it is cancelled
function checkSignal(signal) {
    if (signal == null) {
        throw new Error("missing signal; should not happen");
    }
    signal.checkSignal();
    return signal;
}
/**
 *  Represents a request for a resource using a URI.
 *
 *  By default, the supported schemes are ``HTTP``, ``HTTPS``, ``data:``,
 *  and ``IPFS:``.
 *
 *  Additional schemes can be added globally using [[registerGateway]].
 *
 *  @example:
 *    req = new FetchRequest("https://www.ricmoo.com")
 *    resp = await req.send()
 *    resp.body.length
 *    //_result:
 */
class FetchRequest {
    #allowInsecure;
    #gzip;
    #headers;
    #method;
    #timeout;
    #url;
    #body;
    #bodyType;
    #creds;
    // Hooks
    #preflight;
    #process;
    #retry;
    #signal;
    #throttle;
    /**
     *  The fetch URI to requrest.
     */
    get url() { return this.#url; }
    set url(url) {
        this.#url = String(url);
    }
    /**
     *  The fetch body, if any, to send as the request body. //(default: null)//
     *
     *  When setting a body, the intrinsic ``Content-Type`` is automatically
     *  set and will be used if **not overridden** by setting a custom
     *  header.
     *
     *  If %%body%% is null, the body is cleared (along with the
     *  intrinsic ``Content-Type``) and the .
     *
     *  If %%body%% is a string, the intrincis ``Content-Type`` is set to
     *  ``text/plain``.
     *
     *  If %%body%% is a Uint8Array, the intrincis ``Content-Type`` is set to
     *  ``application/octet-stream``.
     *
     *  If %%body%% is any other object, the intrincis ``Content-Type`` is
     *  set to ``application/json``.
     */
    get body() {
        if (this.#body == null) {
            return null;
        }
        return new Uint8Array(this.#body);
    }
    set body(body) {
        if (body == null) {
            this.#body = undefined;
            this.#bodyType = undefined;
        }
        else if (typeof (body) === "string") {
            this.#body = (0,_utf8_js__WEBPACK_IMPORTED_MODULE_3__.toUtf8Bytes)(body);
            this.#bodyType = "text/plain";
        }
        else if (body instanceof Uint8Array) {
            this.#body = body;
            this.#bodyType = "application/octet-stream";
        }
        else if (typeof (body) === "object") {
            this.#body = (0,_utf8_js__WEBPACK_IMPORTED_MODULE_3__.toUtf8Bytes)(JSON.stringify(body));
            this.#bodyType = "application/json";
        }
        else {
            throw new Error("invalid body");
        }
    }
    /**
     *  Returns true if the request has a body.
     */
    hasBody() {
        return (this.#body != null);
    }
    /**
     *  The HTTP method to use when requesting the URI. If no method
     *  has been explicitly set, then ``GET`` is used if the body is
     *  null and ``POST`` otherwise.
     */
    get method() {
        if (this.#method) {
            return this.#method;
        }
        if (this.hasBody()) {
            return "POST";
        }
        return "GET";
    }
    set method(method) {
        if (method == null) {
            method = "";
        }
        this.#method = String(method).toUpperCase();
    }
    /**
     *  The headers that will be used when requesting the URI. All
     *  keys are lower-case.
     *
     *  This object is a copy, so any chnages will **NOT** be reflected
     *  in the ``FetchRequest``.
     *
     *  To set a header entry, use the ``setHeader`` method.
     */
    get headers() {
        const headers = Object.assign({}, this.#headers);
        if (this.#creds) {
            headers["authorization"] = `Basic ${(0,_base64_js__WEBPACK_IMPORTED_MODULE_1__.encodeBase64)((0,_utf8_js__WEBPACK_IMPORTED_MODULE_3__.toUtf8Bytes)(this.#creds))}`;
        }
        ;
        if (this.allowGzip) {
            headers["accept-encoding"] = "gzip";
        }
        if (headers["content-type"] == null && this.#bodyType) {
            headers["content-type"] = this.#bodyType;
        }
        if (this.body) {
            headers["content-length"] = String(this.body.length);
        }
        return headers;
    }
    /**
     *  Get the header for %%key%%, ignoring case.
     */
    getHeader(key) {
        return this.headers[key.toLowerCase()];
    }
    /**
     *  Set the header for %%key%% to %%value%%. All values are coerced
     *  to a string.
     */
    setHeader(key, value) {
        this.#headers[String(key).toLowerCase()] = String(value);
    }
    /**
     *  Clear all headers, resetting all intrinsic headers.
     */
    clearHeaders() {
        this.#headers = {};
    }
    [Symbol.iterator]() {
        const headers = this.headers;
        const keys = Object.keys(headers);
        let index = 0;
        return {
            next: () => {
                if (index < keys.length) {
                    const key = keys[index++];
                    return {
                        value: [key, headers[key]], done: false
                    };
                }
                return { value: undefined, done: true };
            }
        };
    }
    /**
     *  The value that will be sent for the ``Authorization`` header.
     *
     *  To set the credentials, use the ``setCredentials`` method.
     */
    get credentials() {
        return this.#creds || null;
    }
    /**
     *  Sets an ``Authorization`` for %%username%% with %%password%%.
     */
    setCredentials(username, password) {
        (0,_errors_js__WEBPACK_IMPORTED_MODULE_2__.assertArgument)(!username.match(/:/), "invalid basic authentication username", "username", "[REDACTED]");
        this.#creds = `${username}:${password}`;
    }
    /**
     *  Enable and request gzip-encoded responses. The response will
     *  automatically be decompressed. //(default: true)//
     */
    get allowGzip() {
        return this.#gzip;
    }
    set allowGzip(value) {
        this.#gzip = !!value;
    }
    /**
     *  Allow ``Authentication`` credentials to be sent over insecure
     *  channels. //(default: false)//
     */
    get allowInsecureAuthentication() {
        return !!this.#allowInsecure;
    }
    set allowInsecureAuthentication(value) {
        this.#allowInsecure = !!value;
    }
    /**
     *  The timeout (in milliseconds) to wait for a complere response.
     *  //(default: 5 minutes)//
     */
    get timeout() { return this.#timeout; }
    set timeout(timeout) {
        (0,_errors_js__WEBPACK_IMPORTED_MODULE_2__.assertArgument)(timeout >= 0, "timeout must be non-zero", "timeout", timeout);
        this.#timeout = timeout;
    }
    /**
     *  This function is called prior to each request, for example
     *  during a redirection or retry in case of server throttling.
     *
     *  This offers an opportunity to populate headers or update
     *  content before sending a request.
     */
    get preflightFunc() {
        return this.#preflight || null;
    }
    set preflightFunc(preflight) {
        this.#preflight = preflight;
    }
    /**
     *  This function is called after each response, offering an
     *  opportunity to provide client-level throttling or updating
     *  response data.
     *
     *  Any error thrown in this causes the ``send()`` to throw.
     *
     *  To schedule a retry attempt (assuming the maximum retry limit
     *  has not been reached), use [[response.throwThrottleError]].
     */
    get processFunc() {
        return this.#process || null;
    }
    set processFunc(process) {
        this.#process = process;
    }
    /**
     *  This function is called on each retry attempt.
     */
    get retryFunc() {
        return this.#retry || null;
    }
    set retryFunc(retry) {
        this.#retry = retry;
    }
    /**
     *  Create a new FetchRequest instance with default values.
     *
     *  Once created, each property may be set before issuing a
     *  ``.send()`` to make teh request.
     */
    constructor(url) {
        this.#url = String(url);
        this.#allowInsecure = false;
        this.#gzip = true;
        this.#headers = {};
        this.#method = "";
        this.#timeout = 300000;
        this.#throttle = {
            slotInterval: SLOT_INTERVAL,
            maxAttempts: MAX_ATTEMPTS
        };
    }
    toString() {
        return `<FetchRequest method=${JSON.stringify(this.method)} url=${JSON.stringify(this.url)} headers=${JSON.stringify(this.headers)} body=${this.#body ? (0,_data_js__WEBPACK_IMPORTED_MODULE_4__.hexlify)(this.#body) : "null"}>`;
    }
    /**
     *  Update the throttle parameters used to determine maximum
     *  attempts and exponential-backoff properties.
     */
    setThrottleParams(params) {
        if (params.slotInterval != null) {
            this.#throttle.slotInterval = params.slotInterval;
        }
        if (params.maxAttempts != null) {
            this.#throttle.maxAttempts = params.maxAttempts;
        }
    }
    async #send(attempt, expires, delay, _request, _response) {
        if (attempt >= this.#throttle.maxAttempts) {
            return _response.makeServerError("exceeded maximum retry limit");
        }
        (0,_errors_js__WEBPACK_IMPORTED_MODULE_2__.assert)(getTime() <= expires, "timeout", "TIMEOUT", {
            operation: "request.send", reason: "timeout", request: _request
        });
        if (delay > 0) {
            await wait(delay);
        }
        let req = this.clone();
        const scheme = (req.url.split(":")[0] || "").toLowerCase();
        // Process any Gateways
        if (scheme in Gateways) {
            const result = await Gateways[scheme](req.url, checkSignal(_request.#signal));
            if (result instanceof FetchResponse) {
                let response = result;
                if (this.processFunc) {
                    checkSignal(_request.#signal);
                    try {
                        response = await this.processFunc(req, response);
                    }
                    catch (error) {
                        // Something went wrong during processing; throw a 5xx server error
                        if (error.throttle == null || typeof (error.stall) !== "number") {
                            response.makeServerError("error in post-processing function", error).assertOk();
                        }
                        // Ignore throttling
                    }
                }
                return response;
            }
            req = result;
        }
        // We have a preflight function; update the request
        if (this.preflightFunc) {
            req = await this.preflightFunc(req);
        }
        const resp = await getUrlFunc(req, checkSignal(_request.#signal));
        let response = new FetchResponse(resp.statusCode, resp.statusMessage, resp.headers, resp.body, _request);
        if (response.statusCode === 301 || response.statusCode === 302) {
            // Redirect
            try {
                const location = response.headers.location || "";
                return req.redirect(location).#send(attempt + 1, expires, 0, _request, response);
            }
            catch (error) { }
            // Things won't get any better on another attempt; abort
            return response;
        }
        else if (response.statusCode === 429) {
            // Throttle
            if (this.retryFunc == null || (await this.retryFunc(req, response, attempt))) {
                const retryAfter = response.headers["retry-after"];
                let delay = this.#throttle.slotInterval * Math.trunc(Math.random() * Math.pow(2, attempt));
                if (typeof (retryAfter) === "string" && retryAfter.match(/^[1-9][0-9]*$/)) {
                    delay = parseInt(retryAfter);
                }
                return req.clone().#send(attempt + 1, expires, delay, _request, response);
            }
        }
        if (this.processFunc) {
            checkSignal(_request.#signal);
            try {
                response = await this.processFunc(req, response);
            }
            catch (error) {
                // Something went wrong during processing; throw a 5xx server error
                if (error.throttle == null || typeof (error.stall) !== "number") {
                    response.makeServerError("error in post-processing function", error).assertOk();
                }
                // Throttle
                let delay = this.#throttle.slotInterval * Math.trunc(Math.random() * Math.pow(2, attempt));
                ;
                if (error.stall >= 0) {
                    delay = error.stall;
                }
                return req.clone().#send(attempt + 1, expires, delay, _request, response);
            }
        }
        return response;
    }
    /**
     *  Resolves to the response by sending the request.
     */
    send() {
        (0,_errors_js__WEBPACK_IMPORTED_MODULE_2__.assert)(this.#signal == null, "request already sent", "UNSUPPORTED_OPERATION", { operation: "fetchRequest.send" });
        this.#signal = new FetchCancelSignal(this);
        return this.#send(0, getTime() + this.timeout, 0, this, new FetchResponse(0, "", {}, null, this));
    }
    /**
     *  Cancels the inflight response, causing a ``CANCELLED``
     *  error to be rejected from the [[send]].
     */
    cancel() {
        (0,_errors_js__WEBPACK_IMPORTED_MODULE_2__.assert)(this.#signal != null, "request has not been sent", "UNSUPPORTED_OPERATION", { operation: "fetchRequest.cancel" });
        const signal = fetchSignals.get(this);
        if (!signal) {
            throw new Error("missing signal; should not happen");
        }
        signal();
    }
    /**
     *  Returns a new [[FetchRequest]] that represents the redirection
     *  to %%location%%.
     */
    redirect(location) {
        // Redirection; for now we only support absolute locataions
        const current = this.url.split(":")[0].toLowerCase();
        const target = location.split(":")[0].toLowerCase();
        // Don't allow redirecting:
        // - non-GET requests
        // - downgrading the security (e.g. https => http)
        // - to non-HTTP (or non-HTTPS) protocols [this could be relaxed?]
        (0,_errors_js__WEBPACK_IMPORTED_MODULE_2__.assert)(this.method === "GET" && (current !== "https" || target !== "http") && location.match(/^https?:/), `unsupported redirect`, "UNSUPPORTED_OPERATION", {
            operation: `redirect(${this.method} ${JSON.stringify(this.url)} => ${JSON.stringify(location)})`
        });
        // Create a copy of this request, with a new URL
        const req = new FetchRequest(location);
        req.method = "GET";
        req.allowGzip = this.allowGzip;
        req.timeout = this.timeout;
        req.#headers = Object.assign({}, this.#headers);
        if (this.#body) {
            req.#body = new Uint8Array(this.#body);
        }
        req.#bodyType = this.#bodyType;
        // Do not forward credentials unless on the same domain; only absolute
        //req.allowInsecure = false;
        // paths are currently supported; may want a way to specify to forward?
        //setStore(req.#props, "creds", getStore(this.#pros, "creds"));
        return req;
    }
    /**
     *  Create a new copy of this request.
     */
    clone() {
        const clone = new FetchRequest(this.url);
        // Preserve "default method" (i.e. null)
        clone.#method = this.#method;
        // Preserve "default body" with type, copying the Uint8Array is present
        if (this.#body) {
            clone.#body = this.#body;
        }
        clone.#bodyType = this.#bodyType;
        // Preserve "default headers"
        clone.#headers = Object.assign({}, this.#headers);
        // Credentials is readonly, so we copy internally
        clone.#creds = this.#creds;
        if (this.allowGzip) {
            clone.allowGzip = true;
        }
        clone.timeout = this.timeout;
        if (this.allowInsecureAuthentication) {
            clone.allowInsecureAuthentication = true;
        }
        clone.#preflight = this.#preflight;
        clone.#process = this.#process;
        clone.#retry = this.#retry;
        return clone;
    }
    /**
     *  Locks all static configuration for gateways and FetchGetUrlFunc
     *  registration.
     */
    static lockConfig() {
        locked = true;
    }
    /**
     *  Get the current Gateway function for %%scheme%%.
     */
    static getGateway(scheme) {
        return Gateways[scheme.toLowerCase()] || null;
    }
    /**
     *  Use the %%func%% when fetching URIs using %%scheme%%.
     *
     *  This method affects all requests globally.
     *
     *  If [[lockConfig]] has been called, no change is made and this
     *  throws.
     */
    static registerGateway(scheme, func) {
        scheme = scheme.toLowerCase();
        if (scheme === "http" || scheme === "https") {
            throw new Error(`cannot intercept ${scheme}; use registerGetUrl`);
        }
        if (locked) {
            throw new Error("gateways locked");
        }
        Gateways[scheme] = func;
    }
    /**
     *  Use %%getUrl%% when fetching URIs over HTTP and HTTPS requests.
     *
     *  This method affects all requests globally.
     *
     *  If [[lockConfig]] has been called, no change is made and this
     *  throws.
     */
    static registerGetUrl(getUrl) {
        if (locked) {
            throw new Error("gateways locked");
        }
        getUrlFunc = getUrl;
    }
    /**
     *  Creates a function that can "fetch" data URIs.
     *
     *  Note that this is automatically done internally to support
     *  data URIs, so it is not necessary to register it.
     *
     *  This is not generally something that is needed, but may
     *  be useful in a wrapper to perfom custom data URI functionality.
     */
    static createDataGateway() {
        return dataGatewayFunc;
    }
    /**
     *  Creates a function that will fetch IPFS (unvalidated) from
     *  a custom gateway baseUrl.
     *
     *  The default IPFS gateway used internally is
     *  ``"https:/\/gateway.ipfs.io/ipfs/"``.
     */
    static createIpfsGatewayFunc(baseUrl) {
        return getIpfsGatewayFunc(baseUrl);
    }
}
;
/**
 *  The response for a FetchREquest.
 */
class FetchResponse {
    #statusCode;
    #statusMessage;
    #headers;
    #body;
    #request;
    #error;
    toString() {
        return `<FetchResponse status=${this.statusCode} body=${this.#body ? (0,_data_js__WEBPACK_IMPORTED_MODULE_4__.hexlify)(this.#body) : "null"}>`;
    }
    /**
     *  The response status code.
     */
    get statusCode() { return this.#statusCode; }
    /**
     *  The response status message.
     */
    get statusMessage() { return this.#statusMessage; }
    /**
     *  The response headers. All keys are lower-case.
     */
    get headers() { return Object.assign({}, this.#headers); }
    /**
     *  The response body, or ``null`` if there was no body.
     */
    get body() {
        return (this.#body == null) ? null : new Uint8Array(this.#body);
    }
    /**
     *  The response body as a UTF-8 encoded string, or the empty
     *  string (i.e. ``""``) if there was no body.
     *
     *  An error is thrown if the body is invalid UTF-8 data.
     */
    get bodyText() {
        try {
            return (this.#body == null) ? "" : (0,_utf8_js__WEBPACK_IMPORTED_MODULE_3__.toUtf8String)(this.#body);
        }
        catch (error) {
            (0,_errors_js__WEBPACK_IMPORTED_MODULE_2__.assert)(false, "response body is not valid UTF-8 data", "UNSUPPORTED_OPERATION", {
                operation: "bodyText", info: { response: this }
            });
        }
    }
    /**
     *  The response body, decoded as JSON.
     *
     *  An error is thrown if the body is invalid JSON-encoded data
     *  or if there was no body.
     */
    get bodyJson() {
        try {
            return JSON.parse(this.bodyText);
        }
        catch (error) {
            (0,_errors_js__WEBPACK_IMPORTED_MODULE_2__.assert)(false, "response body is not valid JSON", "UNSUPPORTED_OPERATION", {
                operation: "bodyJson", info: { response: this }
            });
        }
    }
    [Symbol.iterator]() {
        const headers = this.headers;
        const keys = Object.keys(headers);
        let index = 0;
        return {
            next: () => {
                if (index < keys.length) {
                    const key = keys[index++];
                    return {
                        value: [key, headers[key]], done: false
                    };
                }
                return { value: undefined, done: true };
            }
        };
    }
    constructor(statusCode, statusMessage, headers, body, request) {
        this.#statusCode = statusCode;
        this.#statusMessage = statusMessage;
        this.#headers = Object.keys(headers).reduce((accum, k) => {
            accum[k.toLowerCase()] = String(headers[k]);
            return accum;
        }, {});
        this.#body = ((body == null) ? null : new Uint8Array(body));
        this.#request = (request || null);
        this.#error = { message: "" };
    }
    /**
     *  Return a Response with matching headers and body, but with
     *  an error status code (i.e. 599) and %%message%% with an
     *  optional %%error%%.
     */
    makeServerError(message, error) {
        let statusMessage;
        if (!message) {
            message = `${this.statusCode} ${this.statusMessage}`;
            statusMessage = `CLIENT ESCALATED SERVER ERROR (${message})`;
        }
        else {
            statusMessage = `CLIENT ESCALATED SERVER ERROR (${this.statusCode} ${this.statusMessage}; ${message})`;
        }
        const response = new FetchResponse(599, statusMessage, this.headers, this.body, this.#request || undefined);
        response.#error = { message, error };
        return response;
    }
    /**
     *  If called within a [request.processFunc](FetchRequest-processFunc)
     *  call, causes the request to retry as if throttled for %%stall%%
     *  milliseconds.
     */
    throwThrottleError(message, stall) {
        if (stall == null) {
            stall = -1;
        }
        else {
            (0,_errors_js__WEBPACK_IMPORTED_MODULE_2__.assertArgument)(Number.isInteger(stall) && stall >= 0, "invalid stall timeout", "stall", stall);
        }
        const error = new Error(message || "throttling requests");
        (0,_properties_js__WEBPACK_IMPORTED_MODULE_5__.defineProperties)(error, { stall, throttle: true });
        throw error;
    }
    /**
     *  Get the header value for %%key%%, ignoring case.
     */
    getHeader(key) {
        return this.headers[key.toLowerCase()];
    }
    /**
     *  Returns true of the response has a body.
     */
    hasBody() {
        return (this.#body != null);
    }
    /**
     *  The request made for this response.
     */
    get request() { return this.#request; }
    /**
     *  Returns true if this response was a success statusCode.
     */
    ok() {
        return (this.#error.message === "" && this.statusCode >= 200 && this.statusCode < 300);
    }
    /**
     *  Throws a ``SERVER_ERROR`` if this response is not ok.
     */
    assertOk() {
        if (this.ok()) {
            return;
        }
        let { message, error } = this.#error;
        if (message === "") {
            message = `server response ${this.statusCode} ${this.statusMessage}`;
        }
        (0,_errors_js__WEBPACK_IMPORTED_MODULE_2__.assert)(false, message, "SERVER_ERROR", {
            request: (this.request || "unknown request"), response: this, error
        });
    }
}
function getTime() { return (new Date()).getTime(); }
function unpercent(value) {
    return (0,_utf8_js__WEBPACK_IMPORTED_MODULE_3__.toUtf8Bytes)(value.replace(/%([0-9a-f][0-9a-f])/gi, (all, code) => {
        return String.fromCharCode(parseInt(code, 16));
    }));
}
function wait(delay) {
    return new Promise((resolve) => setTimeout(resolve, delay));
}
//# sourceMappingURL=fetch.js.map

/***/ }),

/***/ "./node_modules/ethers/lib.esm/utils/fixednumber.js":
/*!**********************************************************!*\
  !*** ./node_modules/ethers/lib.esm/utils/fixednumber.js ***!
  \**********************************************************/
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "FixedNumber": () => (/* binding */ FixedNumber)
/* harmony export */ });
/* harmony import */ var _data_js__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./data.js */ "./node_modules/ethers/lib.esm/utils/data.js");
/* harmony import */ var _errors_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./errors.js */ "./node_modules/ethers/lib.esm/utils/errors.js");
/* harmony import */ var _maths_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./maths.js */ "./node_modules/ethers/lib.esm/utils/maths.js");
/* harmony import */ var _properties_js__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./properties.js */ "./node_modules/ethers/lib.esm/utils/properties.js");
/**
 *  About fixed-point math...
 *
 *  @_section: api/utils/fixed-point-math:Fixed-Point Maths  [about-fixed-point-math]
 */




const BN_N1 = BigInt(-1);
const BN_0 = BigInt(0);
const BN_1 = BigInt(1);
const BN_5 = BigInt(5);
const _guard = {};
// Constant to pull zeros from for multipliers
let Zeros = "0000";
while (Zeros.length < 80) {
    Zeros += Zeros;
}
// Returns a string "1" followed by decimal "0"s
function getTens(decimals) {
    let result = Zeros;
    while (result.length < decimals) {
        result += result;
    }
    return BigInt("1" + result.substring(0, decimals));
}
function checkValue(val, format, safeOp) {
    const width = BigInt(format.width);
    if (format.signed) {
        const limit = (BN_1 << (width - BN_1));
        (0,_errors_js__WEBPACK_IMPORTED_MODULE_0__.assert)(safeOp == null || (val >= -limit && val < limit), "overflow", "NUMERIC_FAULT", {
            operation: safeOp, fault: "overflow", value: val
        });
        if (val > BN_0) {
            val = (0,_maths_js__WEBPACK_IMPORTED_MODULE_1__.fromTwos)((0,_maths_js__WEBPACK_IMPORTED_MODULE_1__.mask)(val, width), width);
        }
        else {
            val = -(0,_maths_js__WEBPACK_IMPORTED_MODULE_1__.fromTwos)((0,_maths_js__WEBPACK_IMPORTED_MODULE_1__.mask)(-val, width), width);
        }
    }
    else {
        const limit = (BN_1 << width);
        (0,_errors_js__WEBPACK_IMPORTED_MODULE_0__.assert)(safeOp == null || (val >= 0 && val < limit), "overflow", "NUMERIC_FAULT", {
            operation: safeOp, fault: "overflow", value: val
        });
        val = (((val % limit) + limit) % limit) & (limit - BN_1);
    }
    return val;
}
function getFormat(value) {
    if (typeof (value) === "number") {
        value = `fixed128x${value}`;
    }
    let signed = true;
    let width = 128;
    let decimals = 18;
    if (typeof (value) === "string") {
        // Parse the format string
        if (value === "fixed") {
            // defaults...
        }
        else if (value === "ufixed") {
            signed = false;
        }
        else {
            const match = value.match(/^(u?)fixed([0-9]+)x([0-9]+)$/);
            (0,_errors_js__WEBPACK_IMPORTED_MODULE_0__.assertArgument)(match, "invalid fixed format", "format", value);
            signed = (match[1] !== "u");
            width = parseInt(match[2]);
            decimals = parseInt(match[3]);
        }
    }
    else if (value) {
        // Extract the values from the object
        const v = value;
        const check = (key, type, defaultValue) => {
            if (v[key] == null) {
                return defaultValue;
            }
            (0,_errors_js__WEBPACK_IMPORTED_MODULE_0__.assertArgument)(typeof (v[key]) === type, "invalid fixed format (" + key + " not " + type + ")", "format." + key, v[key]);
            return v[key];
        };
        signed = check("signed", "boolean", signed);
        width = check("width", "number", width);
        decimals = check("decimals", "number", decimals);
    }
    (0,_errors_js__WEBPACK_IMPORTED_MODULE_0__.assertArgument)((width % 8) === 0, "invalid FixedNumber width (not byte aligned)", "format.width", width);
    (0,_errors_js__WEBPACK_IMPORTED_MODULE_0__.assertArgument)(decimals <= 80, "invalid FixedNumber decimals (too large)", "format.decimals", decimals);
    const name = (signed ? "" : "u") + "fixed" + String(width) + "x" + String(decimals);
    return { signed, width, decimals, name };
}
function toString(val, decimals) {
    let negative = "";
    if (val < BN_0) {
        negative = "-";
        val *= BN_N1;
    }
    let str = val.toString();
    // No decimal point for whole values
    if (decimals === 0) {
        return (negative + str);
    }
    // Pad out to the whole component (including a whole digit)
    while (str.length <= decimals) {
        str = Zeros + str;
    }
    // Insert the decimal point
    const index = str.length - decimals;
    str = str.substring(0, index) + "." + str.substring(index);
    // Trim the whole component (leaving at least one 0)
    while (str[0] === "0" && str[1] !== ".") {
        str = str.substring(1);
    }
    // Trim the decimal component (leaving at least one 0)
    while (str[str.length - 1] === "0" && str[str.length - 2] !== ".") {
        str = str.substring(0, str.length - 1);
    }
    return (negative + str);
}
/**
 *  A FixedNumber represents a value over its [[FixedFormat]]
 *  arithmetic field.
 *
 *  A FixedNumber can be used to perform math, losslessly, on
 *  values which have decmial places.
 *
 *  A FixedNumber has a fixed bit-width to store values in, and stores all
 *  values internally by multiplying the value by 10 raised to the power of
 *  %%decimals%%.
 *
 *  If operations are performed that cause a value to grow too high (close to
 *  positive infinity) or too low (close to negative infinity), the value
 *  is said to //overflow//.
 *
 *  For example, an 8-bit signed value, with 0 decimals may only be within
 *  the range ``-128`` to ``127``; so ``-128 - 1`` will overflow and become
 *  ``127``. Likewise, ``127 + 1`` will overflow and become ``-127``.
 *
 *  Many operation have a normal and //unsafe// variant. The normal variant
 *  will throw a [[NumericFaultError]] on any overflow, while the //unsafe//
 *  variant will silently allow overflow, corrupting its value value.
 *
 *  If operations are performed that cause a value to become too small
 *  (close to zero), the value loses precison and is said to //underflow//.
 *
 *  For example, an value with 1 decimal place may store a number as small
 *  as ``0.1``, but the value of ``0.1 / 2`` is ``0.05``, which cannot fit
 *  into 1 decimal place, so underflow occurs which means precision is lost
 *  and the value becomes ``0``.
 *
 *  Some operations have a normal and //signalling// variant. The normal
 *  variant will silently ignore underflow, while the //signalling// variant
 *  will thow a [[NumericFaultError]] on underflow.
 */
class FixedNumber {
    /**
     *  The specific fixed-point arithmetic field for this value.
     */
    format;
    #format;
    // The actual value (accounting for decimals)
    #val;
    // A base-10 value to multiple values by to maintain the magnitude
    #tens;
    /**
     *  This is a property so console.log shows a human-meaningful value.
     *
     *  @private
     */
    _value;
    // Use this when changing this file to get some typing info,
    // but then switch to any to mask the internal type
    //constructor(guard: any, value: bigint, format: _FixedFormat) {
    /**
     *  @private
     */
    constructor(guard, value, format) {
        (0,_errors_js__WEBPACK_IMPORTED_MODULE_0__.assertPrivate)(guard, _guard, "FixedNumber");
        this.#val = value;
        this.#format = format;
        const _value = toString(value, format.decimals);
        (0,_properties_js__WEBPACK_IMPORTED_MODULE_2__.defineProperties)(this, { format: format.name, _value });
        this.#tens = getTens(format.decimals);
    }
    /**
     *  If true, negative values are permitted, otherwise only
     *  positive values and zero are allowed.
     */
    get signed() { return this.#format.signed; }
    /**
     *  The number of bits available to store the value.
     */
    get width() { return this.#format.width; }
    /**
     *  The number of decimal places in the fixed-point arithment field.
     */
    get decimals() { return this.#format.decimals; }
    /**
     *  The value as an integer, based on the smallest unit the
     *  [[decimals]] allow.
     */
    get value() { return this.#val; }
    #checkFormat(other) {
        (0,_errors_js__WEBPACK_IMPORTED_MODULE_0__.assertArgument)(this.format === other.format, "incompatible format; use fixedNumber.toFormat", "other", other);
    }
    #checkValue(val, safeOp) {
        /*
                const width = BigInt(this.width);
                if (this.signed) {
                    const limit = (BN_1 << (width - BN_1));
                    assert(safeOp == null || (val >= -limit  && val < limit), "overflow", "NUMERIC_FAULT", {
                        operation: <string>safeOp, fault: "overflow", value: val
                    });
        
                    if (val > BN_0) {
                        val = fromTwos(mask(val, width), width);
                    } else {
                        val = -fromTwos(mask(-val, width), width);
                    }
        
                } else {
                    const masked = mask(val, width);
                    assert(safeOp == null || (val >= 0 && val === masked), "overflow", "NUMERIC_FAULT", {
                        operation: <string>safeOp, fault: "overflow", value: val
                    });
                    val = masked;
                }
        */
        val = checkValue(val, this.#format, safeOp);
        return new FixedNumber(_guard, val, this.#format);
    }
    #add(o, safeOp) {
        this.#checkFormat(o);
        return this.#checkValue(this.#val + o.#val, safeOp);
    }
    /**
     *  Returns a new [[FixedNumber]] with the result of %%this%% added
     *  to %%other%%, ignoring overflow.
     */
    addUnsafe(other) { return this.#add(other); }
    /**
     *  Returns a new [[FixedNumber]] with the result of %%this%% added
     *  to %%other%%. A [[NumericFaultError]] is thrown if overflow
     *  occurs.
     */
    add(other) { return this.#add(other, "add"); }
    #sub(o, safeOp) {
        this.#checkFormat(o);
        return this.#checkValue(this.#val - o.#val, safeOp);
    }
    /**
     *  Returns a new [[FixedNumber]] with the result of %%other%% subtracted
     *  from %%this%%, ignoring overflow.
     */
    subUnsafe(other) { return this.#sub(other); }
    /**
     *  Returns a new [[FixedNumber]] with the result of %%other%% subtracted
     *  from %%this%%. A [[NumericFaultError]] is thrown if overflow
     *  occurs.
     */
    sub(other) { return this.#sub(other, "sub"); }
    #mul(o, safeOp) {
        this.#checkFormat(o);
        return this.#checkValue((this.#val * o.#val) / this.#tens, safeOp);
    }
    /**
     *  Returns a new [[FixedNumber]] with the result of %%this%% multiplied
     *  by %%other%%, ignoring overflow and underflow (precision loss).
     */
    mulUnsafe(other) { return this.#mul(other); }
    /**
     *  Returns a new [[FixedNumber]] with the result of %%this%% multiplied
     *  by %%other%%. A [[NumericFaultError]] is thrown if overflow
     *  occurs.
     */
    mul(other) { return this.#mul(other, "mul"); }
    /**
     *  Returns a new [[FixedNumber]] with the result of %%this%% multiplied
     *  by %%other%%. A [[NumericFaultError]] is thrown if overflow
     *  occurs or if underflow (precision loss) occurs.
     */
    mulSignal(other) {
        this.#checkFormat(other);
        const value = this.#val * other.#val;
        (0,_errors_js__WEBPACK_IMPORTED_MODULE_0__.assert)((value % this.#tens) === BN_0, "precision lost during signalling mul", "NUMERIC_FAULT", {
            operation: "mulSignal", fault: "underflow", value: this
        });
        return this.#checkValue(value / this.#tens, "mulSignal");
    }
    #div(o, safeOp) {
        (0,_errors_js__WEBPACK_IMPORTED_MODULE_0__.assert)(o.#val !== BN_0, "division by zero", "NUMERIC_FAULT", {
            operation: "div", fault: "divide-by-zero", value: this
        });
        this.#checkFormat(o);
        return this.#checkValue((this.#val * this.#tens) / o.#val, safeOp);
    }
    /**
     *  Returns a new [[FixedNumber]] with the result of %%this%% divided
     *  by %%other%%, ignoring underflow (precision loss). A
     *  [[NumericFaultError]] is thrown if overflow occurs.
     */
    divUnsafe(other) { return this.#div(other); }
    /**
     *  Returns a new [[FixedNumber]] with the result of %%this%% divided
     *  by %%other%%, ignoring underflow (precision loss). A
     *  [[NumericFaultError]] is thrown if overflow occurs.
     */
    div(other) { return this.#div(other, "div"); }
    /**
     *  Returns a new [[FixedNumber]] with the result of %%this%% divided
     *  by %%other%%. A [[NumericFaultError]] is thrown if underflow
     *  (precision loss) occurs.
     */
    divSignal(other) {
        (0,_errors_js__WEBPACK_IMPORTED_MODULE_0__.assert)(other.#val !== BN_0, "division by zero", "NUMERIC_FAULT", {
            operation: "div", fault: "divide-by-zero", value: this
        });
        this.#checkFormat(other);
        const value = (this.#val * this.#tens);
        (0,_errors_js__WEBPACK_IMPORTED_MODULE_0__.assert)((value % other.#val) === BN_0, "precision lost during signalling div", "NUMERIC_FAULT", {
            operation: "divSignal", fault: "underflow", value: this
        });
        return this.#checkValue(value / other.#val, "divSignal");
    }
    /**
     *  Returns a comparison result between %%this%% and %%other%%.
     *
     *  This is suitable for use in sorting, where ``-1`` implies %%this%%
     *  is smaller, ``1`` implies %%other%% is larger and ``0`` implies
     *  both are equal.
     */
    cmp(other) {
        let a = this.value, b = other.value;
        // Coerce a and b to the same magnitude
        const delta = this.decimals - other.decimals;
        if (delta > 0) {
            b *= getTens(delta);
        }
        else if (delta < 0) {
            a *= getTens(-delta);
        }
        // Comnpare
        if (a < b) {
            return -1;
        }
        if (a > b) {
            return -1;
        }
        return 0;
    }
    /**
     *  Returns true if %%other%% is equal to %%this%%.
     */
    eq(other) { return this.cmp(other) === 0; }
    /**
     *  Returns true if %%other%% is less than to %%this%%.
     */
    lt(other) { return this.cmp(other) < 0; }
    /**
     *  Returns true if %%other%% is less than or equal to %%this%%.
     */
    lte(other) { return this.cmp(other) <= 0; }
    /**
     *  Returns true if %%other%% is greater than to %%this%%.
     */
    gt(other) { return this.cmp(other) > 0; }
    /**
     *  Returns true if %%other%% is greater than or equal to %%this%%.
     */
    gte(other) { return this.cmp(other) >= 0; }
    /**
     *  Returns a new [[FixedNumber]] which is the largest **integer**
     *  that is less than or equal to %%this%%.
     *
     *  The decimal component of the result will always be ``0``.
     */
    floor() {
        let val = this.#val;
        if (this.#val < BN_0) {
            val -= this.#tens - BN_1;
        }
        val = (this.#val / this.#tens) * this.#tens;
        return this.#checkValue(val, "floor");
    }
    /**
     *  Returns a new [[FixedNumber]] which is the smallest **integer**
     *  that is greater than or equal to %%this%%.
     *
     *  The decimal component of the result will always be ``0``.
     */
    ceiling() {
        let val = this.#val;
        if (this.#val > BN_0) {
            val += this.#tens - BN_1;
        }
        val = (this.#val / this.#tens) * this.#tens;
        return this.#checkValue(val, "ceiling");
    }
    /**
     *  Returns a new [[FixedNumber]] with the decimal component
     *  rounded up on ties at %%decimals%% places.
     */
    round(decimals) {
        if (decimals == null) {
            decimals = 0;
        }
        // Not enough precision to not already be rounded
        if (decimals >= this.decimals) {
            return this;
        }
        const delta = this.decimals - decimals;
        const bump = BN_5 * getTens(delta - 1);
        let value = this.value + bump;
        const tens = getTens(delta);
        value = (value / tens) * tens;
        checkValue(value, this.#format, "round");
        return new FixedNumber(_guard, value, this.#format);
    }
    /**
     *  Returns true if %%this%% is equal to ``0``.
     */
    isZero() { return (this.#val === BN_0); }
    /**
     *  Returns true if %%this%% is less than ``0``.
     */
    isNegative() { return (this.#val < BN_0); }
    /**
     *  Returns the string representation of %%this%%.
     */
    toString() { return this._value; }
    /**
     *  Returns a float approximation.
     *
     *  Due to IEEE 754 precission (or lack thereof), this function
     *  can only return an approximation and most values will contain
     *  rounding errors.
     */
    toUnsafeFloat() { return parseFloat(this.toString()); }
    /**
     *  Return a new [[FixedNumber]] with the same value but has had
     *  its field set to %%format%%.
     *
     *  This will throw if the value cannot fit into %%format%%.
     */
    toFormat(format) {
        return FixedNumber.fromString(this.toString(), format);
    }
    /**
     *  Creates a new [[FixedNumber]] for %%value%% divided by
     *  %%decimal%% places with %%format%%.
     *
     *  This will throw a [[NumericFaultError]] if %%value%% (once adjusted
     *  for %%decimals%%) cannot fit in %%format%%, either due to overflow
     *  or underflow (precision loss).
     */
    static fromValue(_value, decimals, _format) {
        if (decimals == null) {
            decimals = 0;
        }
        const format = getFormat(_format);
        let value = (0,_maths_js__WEBPACK_IMPORTED_MODULE_1__.getBigInt)(_value, "value");
        const delta = decimals - format.decimals;
        if (delta > 0) {
            const tens = getTens(delta);
            (0,_errors_js__WEBPACK_IMPORTED_MODULE_0__.assert)((value % tens) === BN_0, "value loses precision for format", "NUMERIC_FAULT", {
                operation: "fromValue", fault: "underflow", value: _value
            });
            value /= tens;
        }
        else if (delta < 0) {
            value *= getTens(-delta);
        }
        checkValue(value, format, "fromValue");
        return new FixedNumber(_guard, value, format);
    }
    /**
     *  Creates a new [[FixedNumber]] for %%value%% with %%format%%.
     *
     *  This will throw a [[NumericFaultError]] if %%value%% cannot fit
     *  in %%format%%, either due to overflow or underflow (precision loss).
     */
    static fromString(_value, _format) {
        const match = _value.match(/^(-?)([0-9]*)\.?([0-9]*)$/);
        (0,_errors_js__WEBPACK_IMPORTED_MODULE_0__.assertArgument)(match && (match[2].length + match[3].length) > 0, "invalid FixedNumber string value", "value", _value);
        const format = getFormat(_format);
        let whole = (match[2] || "0"), decimal = (match[3] || "");
        // Pad out the decimals
        while (decimal.length < format.decimals) {
            decimal += Zeros;
        }
        // Check precision is safe
        (0,_errors_js__WEBPACK_IMPORTED_MODULE_0__.assert)(decimal.substring(format.decimals).match(/^0*$/), "too many decimals for format", "NUMERIC_FAULT", {
            operation: "fromString", fault: "underflow", value: _value
        });
        // Remove extra padding
        decimal = decimal.substring(0, format.decimals);
        const value = BigInt(match[1] + whole + decimal);
        checkValue(value, format, "fromString");
        return new FixedNumber(_guard, value, format);
    }
    /**
     *  Creates a new [[FixedNumber]] with the big-endian representation
     *  %%value%% with %%format%%.
     *
     *  This will throw a [[NumericFaultError]] if %%value%% cannot fit
     *  in %%format%% due to overflow.
     */
    static fromBytes(_value, _format) {
        let value = (0,_maths_js__WEBPACK_IMPORTED_MODULE_1__.toBigInt)((0,_data_js__WEBPACK_IMPORTED_MODULE_3__.getBytes)(_value, "value"));
        const format = getFormat(_format);
        if (format.signed) {
            value = (0,_maths_js__WEBPACK_IMPORTED_MODULE_1__.fromTwos)(value, format.width);
        }
        checkValue(value, format, "fromBytes");
        return new FixedNumber(_guard, value, format);
    }
}
//const f1 = FixedNumber.fromString("12.56", "fixed16x2");
//const f2 = FixedNumber.fromString("0.3", "fixed16x2");
//console.log(f1.divSignal(f2));
//const BUMP = FixedNumber.from("0.5");
//# sourceMappingURL=fixednumber.js.map

/***/ }),

/***/ "./node_modules/ethers/lib.esm/utils/geturl-browser.js":
/*!*************************************************************!*\
  !*** ./node_modules/ethers/lib.esm/utils/geturl-browser.js ***!
  \*************************************************************/
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "getUrl": () => (/* binding */ getUrl)
/* harmony export */ });
/* harmony import */ var _errors_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./errors.js */ "./node_modules/ethers/lib.esm/utils/errors.js");

// @TODO: timeout is completely ignored; start a Promise.any with a reject?
async function getUrl(req, _signal) {
    const protocol = req.url.split(":")[0].toLowerCase();
    (0,_errors_js__WEBPACK_IMPORTED_MODULE_0__.assert)(protocol === "http" || protocol === "https", `unsupported protocol ${protocol}`, "UNSUPPORTED_OPERATION", {
        info: { protocol },
        operation: "request"
    });
    (0,_errors_js__WEBPACK_IMPORTED_MODULE_0__.assert)(!req.credentials || req.allowInsecureAuthentication, "insecure authorized connections unsupported", "UNSUPPORTED_OPERATION", {
        operation: "request"
    });
    let signal = undefined;
    if (_signal) {
        const controller = new AbortController();
        signal = controller.signal;
        _signal.addListener(() => { controller.abort(); });
    }
    const init = {
        method: req.method,
        headers: new Headers(Array.from(req)),
        body: req.body || undefined,
        signal
    };
    const resp = await fetch(req.url, init);
    const headers = {};
    resp.headers.forEach((value, key) => {
        headers[key.toLowerCase()] = value;
    });
    const respBody = await resp.arrayBuffer();
    const body = (respBody == null) ? null : new Uint8Array(respBody);
    return {
        statusCode: resp.status,
        statusMessage: resp.statusText,
        headers, body
    };
}
//# sourceMappingURL=geturl-browser.js.map

/***/ }),

/***/ "./node_modules/ethers/lib.esm/utils/maths.js":
/*!****************************************************!*\
  !*** ./node_modules/ethers/lib.esm/utils/maths.js ***!
  \****************************************************/
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "fromTwos": () => (/* binding */ fromTwos),
/* harmony export */   "getBigInt": () => (/* binding */ getBigInt),
/* harmony export */   "getNumber": () => (/* binding */ getNumber),
/* harmony export */   "getUint": () => (/* binding */ getUint),
/* harmony export */   "mask": () => (/* binding */ mask),
/* harmony export */   "toBeArray": () => (/* binding */ toBeArray),
/* harmony export */   "toBeHex": () => (/* binding */ toBeHex),
/* harmony export */   "toBigInt": () => (/* binding */ toBigInt),
/* harmony export */   "toNumber": () => (/* binding */ toNumber),
/* harmony export */   "toQuantity": () => (/* binding */ toQuantity),
/* harmony export */   "toTwos": () => (/* binding */ toTwos)
/* harmony export */ });
/* harmony import */ var _data_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./data.js */ "./node_modules/ethers/lib.esm/utils/data.js");
/* harmony import */ var _errors_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./errors.js */ "./node_modules/ethers/lib.esm/utils/errors.js");
/**
 *  Some mathematic operations.
 *
 *  @_subsection: api/utils:Math Helpers  [about-maths]
 */


const BN_0 = BigInt(0);
const BN_1 = BigInt(1);
//const BN_Max256 = (BN_1 << BigInt(256)) - BN_1;
// IEEE 754 support 53-bits of mantissa
const maxValue = 0x1fffffffffffff;
/**
 *  Convert %%value%% from a twos-compliment representation of %%width%%
 *  bits to its value.
 *
 *  If the highest bit is ``1``, the result will be negative.
 */
function fromTwos(_value, _width) {
    const value = getUint(_value, "value");
    const width = BigInt(getNumber(_width, "width"));
    (0,_errors_js__WEBPACK_IMPORTED_MODULE_0__.assert)((value >> width) === BN_0, "overflow", "NUMERIC_FAULT", {
        operation: "fromTwos", fault: "overflow", value: _value
    });
    // Top bit set; treat as a negative value
    if (value >> (width - BN_1)) {
        const mask = (BN_1 << width) - BN_1;
        return -(((~value) & mask) + BN_1);
    }
    return value;
}
/**
 *  Convert %%value%% to a twos-compliment representation of
 *  %%width%% bits.
 *
 *  The result will always be positive.
 */
function toTwos(_value, _width) {
    let value = getBigInt(_value, "value");
    const width = BigInt(getNumber(_width, "width"));
    const limit = (BN_1 << (width - BN_1));
    if (value < BN_0) {
        value = -value;
        (0,_errors_js__WEBPACK_IMPORTED_MODULE_0__.assert)(value <= limit, "too low", "NUMERIC_FAULT", {
            operation: "toTwos", fault: "overflow", value: _value
        });
        const mask = (BN_1 << width) - BN_1;
        return ((~value) & mask) + BN_1;
    }
    else {
        (0,_errors_js__WEBPACK_IMPORTED_MODULE_0__.assert)(value < limit, "too high", "NUMERIC_FAULT", {
            operation: "toTwos", fault: "overflow", value: _value
        });
    }
    return value;
}
/**
 *  Mask %%value%% with a bitmask of %%bits%% ones.
 */
function mask(_value, _bits) {
    const value = getUint(_value, "value");
    const bits = BigInt(getNumber(_bits, "bits"));
    return value & ((BN_1 << bits) - BN_1);
}
/**
 *  Gets a BigInt from %%value%%. If it is an invalid value for
 *  a BigInt, then an ArgumentError will be thrown for %%name%%.
 */
function getBigInt(value, name) {
    switch (typeof (value)) {
        case "bigint": return value;
        case "number":
            (0,_errors_js__WEBPACK_IMPORTED_MODULE_0__.assertArgument)(Number.isInteger(value), "underflow", name || "value", value);
            (0,_errors_js__WEBPACK_IMPORTED_MODULE_0__.assertArgument)(value >= -maxValue && value <= maxValue, "overflow", name || "value", value);
            return BigInt(value);
        case "string":
            try {
                if (value === "") {
                    throw new Error("empty string");
                }
                if (value[0] === "-" && value[1] !== "-") {
                    return -BigInt(value.substring(1));
                }
                return BigInt(value);
            }
            catch (e) {
                (0,_errors_js__WEBPACK_IMPORTED_MODULE_0__.assertArgument)(false, `invalid BigNumberish string: ${e.message}`, name || "value", value);
            }
    }
    (0,_errors_js__WEBPACK_IMPORTED_MODULE_0__.assertArgument)(false, "invalid BigNumberish value", name || "value", value);
}
function getUint(value, name) {
    const result = getBigInt(value, name);
    (0,_errors_js__WEBPACK_IMPORTED_MODULE_0__.assert)(result >= BN_0, "unsigned value cannot be negative", "NUMERIC_FAULT", {
        fault: "overflow", operation: "getUint", value
    });
    return result;
}
const Nibbles = "0123456789abcdef";
/*
 * Converts %%value%% to a BigInt. If %%value%% is a Uint8Array, it
 * is treated as Big Endian data.
 */
function toBigInt(value) {
    if (value instanceof Uint8Array) {
        let result = "0x0";
        for (const v of value) {
            result += Nibbles[v >> 4];
            result += Nibbles[v & 0x0f];
        }
        return BigInt(result);
    }
    return getBigInt(value);
}
/**
 *  Gets a //number// from %%value%%. If it is an invalid value for
 *  a //number//, then an ArgumentError will be thrown for %%name%%.
 */
function getNumber(value, name) {
    switch (typeof (value)) {
        case "bigint":
            (0,_errors_js__WEBPACK_IMPORTED_MODULE_0__.assertArgument)(value >= -maxValue && value <= maxValue, "overflow", name || "value", value);
            return Number(value);
        case "number":
            (0,_errors_js__WEBPACK_IMPORTED_MODULE_0__.assertArgument)(Number.isInteger(value), "underflow", name || "value", value);
            (0,_errors_js__WEBPACK_IMPORTED_MODULE_0__.assertArgument)(value >= -maxValue && value <= maxValue, "overflow", name || "value", value);
            return value;
        case "string":
            try {
                if (value === "") {
                    throw new Error("empty string");
                }
                return getNumber(BigInt(value), name);
            }
            catch (e) {
                (0,_errors_js__WEBPACK_IMPORTED_MODULE_0__.assertArgument)(false, `invalid numeric string: ${e.message}`, name || "value", value);
            }
    }
    (0,_errors_js__WEBPACK_IMPORTED_MODULE_0__.assertArgument)(false, "invalid numeric value", name || "value", value);
}
/**
 *  Converts %%value%% to a number. If %%value%% is a Uint8Array, it
 *  is treated as Big Endian data. Throws if the value is not safe.
 */
function toNumber(value) {
    return getNumber(toBigInt(value));
}
/**
 *  Converts %%value%% to a Big Endian hexstring, optionally padded to
 *  %%width%% bytes.
 */
function toBeHex(_value, _width) {
    const value = getUint(_value, "value");
    let result = value.toString(16);
    if (_width == null) {
        // Ensure the value is of even length
        if (result.length % 2) {
            result = "0" + result;
        }
    }
    else {
        const width = getNumber(_width, "width");
        (0,_errors_js__WEBPACK_IMPORTED_MODULE_0__.assert)(width * 2 >= result.length, `value exceeds width (${width} bits)`, "NUMERIC_FAULT", {
            operation: "toBeHex",
            fault: "overflow",
            value: _value
        });
        // Pad the value to the required width
        while (result.length < (width * 2)) {
            result = "0" + result;
        }
    }
    return "0x" + result;
}
/**
 *  Converts %%value%% to a Big Endian Uint8Array.
 */
function toBeArray(_value) {
    const value = getUint(_value, "value");
    if (value === BN_0) {
        return new Uint8Array([]);
    }
    let hex = value.toString(16);
    if (hex.length % 2) {
        hex = "0" + hex;
    }
    const result = new Uint8Array(hex.length / 2);
    for (let i = 0; i < result.length; i++) {
        const offset = i * 2;
        result[i] = parseInt(hex.substring(offset, offset + 2), 16);
    }
    return result;
}
/**
 *  Returns a [[HexString]] for %%value%% safe to use as a //Quantity//.
 *
 *  A //Quantity// does not have and leading 0 values unless the value is
 *  the literal value `0x0`. This is most commonly used for JSSON-RPC
 *  numeric values.
 */
function toQuantity(value) {
    let result = (0,_data_js__WEBPACK_IMPORTED_MODULE_1__.hexlify)((0,_data_js__WEBPACK_IMPORTED_MODULE_1__.isBytesLike)(value) ? value : toBeArray(value)).substring(2);
    while (result.startsWith("0")) {
        result = result.substring(1);
    }
    if (result === "") {
        result = "0";
    }
    return "0x" + result;
}
//# sourceMappingURL=maths.js.map

/***/ }),

/***/ "./node_modules/ethers/lib.esm/utils/properties.js":
/*!*********************************************************!*\
  !*** ./node_modules/ethers/lib.esm/utils/properties.js ***!
  \*********************************************************/
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "defineProperties": () => (/* binding */ defineProperties),
/* harmony export */   "resolveProperties": () => (/* binding */ resolveProperties)
/* harmony export */ });
/**
 *  Property helper functions.
 *
 *  @_subsection api/utils:Properties  [about-properties]
 */
function checkType(value, type, name) {
    const types = type.split("|").map(t => t.trim());
    for (let i = 0; i < types.length; i++) {
        switch (type) {
            case "any":
                return;
            case "bigint":
            case "boolean":
            case "number":
            case "string":
                if (typeof (value) === type) {
                    return;
                }
        }
    }
    const error = new Error(`invalid value for type ${type}`);
    error.code = "INVALID_ARGUMENT";
    error.argument = `value.${name}`;
    error.value = value;
    throw error;
}
/**
 *  Resolves to a new object that is a copy of %%value%%, but with all
 *  values resolved.
 */
async function resolveProperties(value) {
    const keys = Object.keys(value);
    const results = await Promise.all(keys.map((k) => Promise.resolve(value[k])));
    return results.reduce((accum, v, index) => {
        accum[keys[index]] = v;
        return accum;
    }, {});
}
/**
 *  Assigns the %%values%% to %%target%% as read-only values.
 *
 *  It %%types%% is specified, the values are checked.
 */
function defineProperties(target, values, types) {
    for (let key in values) {
        let value = values[key];
        const type = (types ? types[key] : null);
        if (type) {
            checkType(value, type, key);
        }
        Object.defineProperty(target, key, { enumerable: true, value, writable: false });
    }
}
//# sourceMappingURL=properties.js.map

/***/ }),

/***/ "./node_modules/ethers/lib.esm/utils/rlp-decode.js":
/*!*********************************************************!*\
  !*** ./node_modules/ethers/lib.esm/utils/rlp-decode.js ***!
  \*********************************************************/
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "decodeRlp": () => (/* binding */ decodeRlp)
/* harmony export */ });
/* harmony import */ var _data_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./data.js */ "./node_modules/ethers/lib.esm/utils/data.js");
/* harmony import */ var _errors_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./errors.js */ "./node_modules/ethers/lib.esm/utils/errors.js");
//See: https://github.com/ethereum/wiki/wiki/RLP



function hexlifyByte(value) {
    let result = value.toString(16);
    while (result.length < 2) {
        result = "0" + result;
    }
    return "0x" + result;
}
function unarrayifyInteger(data, offset, length) {
    let result = 0;
    for (let i = 0; i < length; i++) {
        result = (result * 256) + data[offset + i];
    }
    return result;
}
function _decodeChildren(data, offset, childOffset, length) {
    const result = [];
    while (childOffset < offset + 1 + length) {
        const decoded = _decode(data, childOffset);
        result.push(decoded.result);
        childOffset += decoded.consumed;
        (0,_errors_js__WEBPACK_IMPORTED_MODULE_0__.assert)(childOffset <= offset + 1 + length, "child data too short", "BUFFER_OVERRUN", {
            buffer: data, length, offset
        });
    }
    return { consumed: (1 + length), result: result };
}
// returns { consumed: number, result: Object }
function _decode(data, offset) {
    (0,_errors_js__WEBPACK_IMPORTED_MODULE_0__.assert)(data.length !== 0, "data too short", "BUFFER_OVERRUN", {
        buffer: data, length: 0, offset: 1
    });
    const checkOffset = (offset) => {
        (0,_errors_js__WEBPACK_IMPORTED_MODULE_0__.assert)(offset <= data.length, "data short segment too short", "BUFFER_OVERRUN", {
            buffer: data, length: data.length, offset
        });
    };
    // Array with extra length prefix
    if (data[offset] >= 0xf8) {
        const lengthLength = data[offset] - 0xf7;
        checkOffset(offset + 1 + lengthLength);
        const length = unarrayifyInteger(data, offset + 1, lengthLength);
        checkOffset(offset + 1 + lengthLength + length);
        return _decodeChildren(data, offset, offset + 1 + lengthLength, lengthLength + length);
    }
    else if (data[offset] >= 0xc0) {
        const length = data[offset] - 0xc0;
        checkOffset(offset + 1 + length);
        return _decodeChildren(data, offset, offset + 1, length);
    }
    else if (data[offset] >= 0xb8) {
        const lengthLength = data[offset] - 0xb7;
        checkOffset(offset + 1 + lengthLength);
        const length = unarrayifyInteger(data, offset + 1, lengthLength);
        checkOffset(offset + 1 + lengthLength + length);
        const result = (0,_data_js__WEBPACK_IMPORTED_MODULE_1__.hexlify)(data.slice(offset + 1 + lengthLength, offset + 1 + lengthLength + length));
        return { consumed: (1 + lengthLength + length), result: result };
    }
    else if (data[offset] >= 0x80) {
        const length = data[offset] - 0x80;
        checkOffset(offset + 1 + length);
        const result = (0,_data_js__WEBPACK_IMPORTED_MODULE_1__.hexlify)(data.slice(offset + 1, offset + 1 + length));
        return { consumed: (1 + length), result: result };
    }
    return { consumed: 1, result: hexlifyByte(data[offset]) };
}
/**
 *  Decodes %%data%% into the structured data it represents.
 */
function decodeRlp(_data) {
    const data = (0,_data_js__WEBPACK_IMPORTED_MODULE_1__.getBytes)(_data, "data");
    const decoded = _decode(data, 0);
    (0,_errors_js__WEBPACK_IMPORTED_MODULE_0__.assertArgument)(decoded.consumed === data.length, "unexpected junk after rlp payload", "data", _data);
    return decoded.result;
}
//# sourceMappingURL=rlp-decode.js.map

/***/ }),

/***/ "./node_modules/ethers/lib.esm/utils/rlp-encode.js":
/*!*********************************************************!*\
  !*** ./node_modules/ethers/lib.esm/utils/rlp-encode.js ***!
  \*********************************************************/
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "encodeRlp": () => (/* binding */ encodeRlp)
/* harmony export */ });
/* harmony import */ var _data_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./data.js */ "./node_modules/ethers/lib.esm/utils/data.js");
//See: https://github.com/ethereum/wiki/wiki/RLP

function arrayifyInteger(value) {
    const result = [];
    while (value) {
        result.unshift(value & 0xff);
        value >>= 8;
    }
    return result;
}
function _encode(object) {
    if (Array.isArray(object)) {
        let payload = [];
        object.forEach(function (child) {
            payload = payload.concat(_encode(child));
        });
        if (payload.length <= 55) {
            payload.unshift(0xc0 + payload.length);
            return payload;
        }
        const length = arrayifyInteger(payload.length);
        length.unshift(0xf7 + length.length);
        return length.concat(payload);
    }
    const data = Array.prototype.slice.call((0,_data_js__WEBPACK_IMPORTED_MODULE_0__.getBytes)(object, "object"));
    if (data.length === 1 && data[0] <= 0x7f) {
        return data;
    }
    else if (data.length <= 55) {
        data.unshift(0x80 + data.length);
        return data;
    }
    const length = arrayifyInteger(data.length);
    length.unshift(0xb7 + length.length);
    return length.concat(data);
}
const nibbles = "0123456789abcdef";
/**
 *  Encodes %%object%% as an RLP-encoded [[DataHexString]].
 */
function encodeRlp(object) {
    let result = "0x";
    for (const v of _encode(object)) {
        result += nibbles[v >> 4];
        result += nibbles[v & 0xf];
    }
    return result;
}
//# sourceMappingURL=rlp-encode.js.map

/***/ }),

/***/ "./node_modules/ethers/lib.esm/utils/units.js":
/*!****************************************************!*\
  !*** ./node_modules/ethers/lib.esm/utils/units.js ***!
  \****************************************************/
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "formatEther": () => (/* binding */ formatEther),
/* harmony export */   "formatUnits": () => (/* binding */ formatUnits),
/* harmony export */   "parseEther": () => (/* binding */ parseEther),
/* harmony export */   "parseUnits": () => (/* binding */ parseUnits)
/* harmony export */ });
/* harmony import */ var _errors_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./errors.js */ "./node_modules/ethers/lib.esm/utils/errors.js");
/* harmony import */ var _fixednumber_js__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./fixednumber.js */ "./node_modules/ethers/lib.esm/utils/fixednumber.js");
/* harmony import */ var _maths_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./maths.js */ "./node_modules/ethers/lib.esm/utils/maths.js");
/**
 *  Most interactions with Ethereum requires integer values, which use
 *  the smallest magnitude unit.
 *
 *  For example, imagine dealing with dollars and cents. Since dollars
 *  are divisible, non-integer values are possible, such as ``$10.77``.
 *  By using the smallest indivisible unit (i.e. cents), the value can
 *  be kept as the integer ``1077``.
 *
 *  When receiving decimal input from the user (as a decimal string),
 *  the value should be converted to an integer and when showing a user
 *  a value, the integer value should be converted to a decimal string.
 *
 *  This creates a clear distinction, between values to be used by code
 *  (integers) and values used for display logic to users (decimals).
 *
 *  The native unit in Ethereum, //ether// is divisible to 18 decimal places,
 *  where each individual unit is called a //wei//.
 *
 *  @_subsection api/utils:Unit Conversion  [about-units]
 */



const names = [
    "wei",
    "kwei",
    "mwei",
    "gwei",
    "szabo",
    "finney",
    "ether",
];
/**
 *  Converts %%value%% into a //decimal string//, assuming %%unit%% decimal
 *  places. The %%unit%% may be the number of decimal places or the name of
 *  a unit (e.g. ``"gwei"`` for 9 decimal places).
 *
 */
function formatUnits(value, unit) {
    let decimals = 18;
    if (typeof (unit) === "string") {
        const index = names.indexOf(unit);
        (0,_errors_js__WEBPACK_IMPORTED_MODULE_0__.assertArgument)(index >= 0, "invalid unit", "unit", unit);
        decimals = 3 * index;
    }
    else if (unit != null) {
        decimals = (0,_maths_js__WEBPACK_IMPORTED_MODULE_1__.getNumber)(unit, "unit");
    }
    return _fixednumber_js__WEBPACK_IMPORTED_MODULE_2__.FixedNumber.fromValue(value, decimals, { decimals }).toString();
}
/**
 *  Converts the //decimal string// %%value%% to a BigInt, assuming
 *  %%unit%% decimal places. The %%unit%% may the number of decimal places
 *  or the name of a unit (e.g. ``"gwei"`` for 9 decimal places).
 */
function parseUnits(value, unit) {
    (0,_errors_js__WEBPACK_IMPORTED_MODULE_0__.assertArgument)(typeof (value) === "string", "value must be a string", "value", value);
    let decimals = 18;
    if (typeof (unit) === "string") {
        const index = names.indexOf(unit);
        (0,_errors_js__WEBPACK_IMPORTED_MODULE_0__.assertArgument)(index >= 0, "invalid unit", "unit", unit);
        decimals = 3 * index;
    }
    else if (unit != null) {
        decimals = (0,_maths_js__WEBPACK_IMPORTED_MODULE_1__.getNumber)(unit, "unit");
    }
    return _fixednumber_js__WEBPACK_IMPORTED_MODULE_2__.FixedNumber.fromString(value, { decimals }).value;
}
/**
 *  Converts %%value%% into a //decimal string// using 18 decimal places.
 */
function formatEther(wei) {
    return formatUnits(wei, 18);
}
/**
 *  Converts the //decimal string// %%ether%% to a BigInt, using 18
 *  decimal places.
 */
function parseEther(ether) {
    return parseUnits(ether, 18);
}
//# sourceMappingURL=units.js.map

/***/ }),

/***/ "./node_modules/ethers/lib.esm/utils/utf8.js":
/*!***************************************************!*\
  !*** ./node_modules/ethers/lib.esm/utils/utf8.js ***!
  \***************************************************/
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "Utf8ErrorFuncs": () => (/* binding */ Utf8ErrorFuncs),
/* harmony export */   "toUtf8Bytes": () => (/* binding */ toUtf8Bytes),
/* harmony export */   "toUtf8CodePoints": () => (/* binding */ toUtf8CodePoints),
/* harmony export */   "toUtf8String": () => (/* binding */ toUtf8String)
/* harmony export */ });
/* harmony import */ var _data_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./data.js */ "./node_modules/ethers/lib.esm/utils/data.js");
/* harmony import */ var _errors_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./errors.js */ "./node_modules/ethers/lib.esm/utils/errors.js");
/**
 *  Using strings in Ethereum (or any security-basd system) requires
 *  additional care. These utilities attempt to mitigate some of the
 *  safety issues as well as provide the ability to recover and analyse
 *  strings.
 *
 *  @_subsection api/utils:Strings and UTF-8  [about-strings]
 */


function errorFunc(reason, offset, bytes, output, badCodepoint) {
    (0,_errors_js__WEBPACK_IMPORTED_MODULE_0__.assertArgument)(false, `invalid codepoint at offset ${offset}; ${reason}`, "bytes", bytes);
}
function ignoreFunc(reason, offset, bytes, output, badCodepoint) {
    // If there is an invalid prefix (including stray continuation), skip any additional continuation bytes
    if (reason === "BAD_PREFIX" || reason === "UNEXPECTED_CONTINUE") {
        let i = 0;
        for (let o = offset + 1; o < bytes.length; o++) {
            if (bytes[o] >> 6 !== 0x02) {
                break;
            }
            i++;
        }
        return i;
    }
    // This byte runs us past the end of the string, so just jump to the end
    // (but the first byte was read already read and therefore skipped)
    if (reason === "OVERRUN") {
        return bytes.length - offset - 1;
    }
    // Nothing to skip
    return 0;
}
function replaceFunc(reason, offset, bytes, output, badCodepoint) {
    // Overlong representations are otherwise "valid" code points; just non-deistingtished
    if (reason === "OVERLONG") {
        (0,_errors_js__WEBPACK_IMPORTED_MODULE_0__.assertArgument)(typeof (badCodepoint) === "number", "invalid bad code point for replacement", "badCodepoint", badCodepoint);
        output.push(badCodepoint);
        return 0;
    }
    // Put the replacement character into the output
    output.push(0xfffd);
    // Otherwise, process as if ignoring errors
    return ignoreFunc(reason, offset, bytes, output, badCodepoint);
}
/**
 *  A handful of popular, built-in UTF-8 error handling strategies.
 *
 *  **``"error"``** - throws on ANY illegal UTF-8 sequence or
 *  non-canonical (overlong) codepoints (this is the default)
 *
 *  **``"ignore"``** - silently drops any illegal UTF-8 sequence
 *  and accepts non-canonical (overlong) codepoints
 *
 *  **``"replace"``** - replace any illegal UTF-8 sequence with the
 *  UTF-8 replacement character (i.e. ``"\\ufffd"``) and accepts
 *  non-canonical (overlong) codepoints
 *
 *  @returns: Record<"error" | "ignore" | "replace", Utf8ErrorFunc>
 */
const Utf8ErrorFuncs = Object.freeze({
    error: errorFunc,
    ignore: ignoreFunc,
    replace: replaceFunc
});
// http://stackoverflow.com/questions/13356493/decode-utf-8-with-javascript#13691499
function getUtf8CodePoints(_bytes, onError) {
    if (onError == null) {
        onError = Utf8ErrorFuncs.error;
    }
    const bytes = (0,_data_js__WEBPACK_IMPORTED_MODULE_1__.getBytes)(_bytes, "bytes");
    const result = [];
    let i = 0;
    // Invalid bytes are ignored
    while (i < bytes.length) {
        const c = bytes[i++];
        // 0xxx xxxx
        if (c >> 7 === 0) {
            result.push(c);
            continue;
        }
        // Multibyte; how many bytes left for this character?
        let extraLength = null;
        let overlongMask = null;
        // 110x xxxx 10xx xxxx
        if ((c & 0xe0) === 0xc0) {
            extraLength = 1;
            overlongMask = 0x7f;
            // 1110 xxxx 10xx xxxx 10xx xxxx
        }
        else if ((c & 0xf0) === 0xe0) {
            extraLength = 2;
            overlongMask = 0x7ff;
            // 1111 0xxx 10xx xxxx 10xx xxxx 10xx xxxx
        }
        else if ((c & 0xf8) === 0xf0) {
            extraLength = 3;
            overlongMask = 0xffff;
        }
        else {
            if ((c & 0xc0) === 0x80) {
                i += onError("UNEXPECTED_CONTINUE", i - 1, bytes, result);
            }
            else {
                i += onError("BAD_PREFIX", i - 1, bytes, result);
            }
            continue;
        }
        // Do we have enough bytes in our data?
        if (i - 1 + extraLength >= bytes.length) {
            i += onError("OVERRUN", i - 1, bytes, result);
            continue;
        }
        // Remove the length prefix from the char
        let res = c & ((1 << (8 - extraLength - 1)) - 1);
        for (let j = 0; j < extraLength; j++) {
            let nextChar = bytes[i];
            // Invalid continuation byte
            if ((nextChar & 0xc0) != 0x80) {
                i += onError("MISSING_CONTINUE", i, bytes, result);
                res = null;
                break;
            }
            ;
            res = (res << 6) | (nextChar & 0x3f);
            i++;
        }
        // See above loop for invalid continuation byte
        if (res === null) {
            continue;
        }
        // Maximum code point
        if (res > 0x10ffff) {
            i += onError("OUT_OF_RANGE", i - 1 - extraLength, bytes, result, res);
            continue;
        }
        // Reserved for UTF-16 surrogate halves
        if (res >= 0xd800 && res <= 0xdfff) {
            i += onError("UTF16_SURROGATE", i - 1 - extraLength, bytes, result, res);
            continue;
        }
        // Check for overlong sequences (more bytes than needed)
        if (res <= overlongMask) {
            i += onError("OVERLONG", i - 1 - extraLength, bytes, result, res);
            continue;
        }
        result.push(res);
    }
    return result;
}
// http://stackoverflow.com/questions/18729405/how-to-convert-utf8-string-to-byte-array
/**
 *  Returns the UTF-8 byte representation of %%str%%.
 *
 *  If %%form%% is specified, the string is normalized.
 */
function toUtf8Bytes(str, form) {
    if (form != null) {
        (0,_errors_js__WEBPACK_IMPORTED_MODULE_0__.assertNormalize)(form);
        str = str.normalize(form);
    }
    let result = [];
    for (let i = 0; i < str.length; i++) {
        const c = str.charCodeAt(i);
        if (c < 0x80) {
            result.push(c);
        }
        else if (c < 0x800) {
            result.push((c >> 6) | 0xc0);
            result.push((c & 0x3f) | 0x80);
        }
        else if ((c & 0xfc00) == 0xd800) {
            i++;
            const c2 = str.charCodeAt(i);
            (0,_errors_js__WEBPACK_IMPORTED_MODULE_0__.assertArgument)(i < str.length && ((c2 & 0xfc00) === 0xdc00), "invalid surrogate pair", "str", str);
            // Surrogate Pair
            const pair = 0x10000 + ((c & 0x03ff) << 10) + (c2 & 0x03ff);
            result.push((pair >> 18) | 0xf0);
            result.push(((pair >> 12) & 0x3f) | 0x80);
            result.push(((pair >> 6) & 0x3f) | 0x80);
            result.push((pair & 0x3f) | 0x80);
        }
        else {
            result.push((c >> 12) | 0xe0);
            result.push(((c >> 6) & 0x3f) | 0x80);
            result.push((c & 0x3f) | 0x80);
        }
    }
    return new Uint8Array(result);
}
;
//export 
function _toUtf8String(codePoints) {
    return codePoints.map((codePoint) => {
        if (codePoint <= 0xffff) {
            return String.fromCharCode(codePoint);
        }
        codePoint -= 0x10000;
        return String.fromCharCode((((codePoint >> 10) & 0x3ff) + 0xd800), ((codePoint & 0x3ff) + 0xdc00));
    }).join("");
}
/**
 *  Returns the string represented by the UTF-8 data %%bytes%%.
 *
 *  When %%onError%% function is specified, it is called on UTF-8
 *  errors allowing recovery using the [[Utf8ErrorFunc]] API.
 *  (default: [error](Utf8ErrorFuncs))
 */
function toUtf8String(bytes, onError) {
    return _toUtf8String(getUtf8CodePoints(bytes, onError));
}
/**
 *  Returns the UTF-8 code-points for %%str%%.
 *
 *  If %%form%% is specified, the string is normalized.
 */
function toUtf8CodePoints(str, form) {
    return getUtf8CodePoints(toUtf8Bytes(str, form));
}
//# sourceMappingURL=utf8.js.map

/***/ })

/******/ 	});
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		var cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			// no module.id needed
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		__webpack_modules__[moduleId](module, module.exports, __webpack_require__);
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/************************************************************************/
/******/ 	/* webpack/runtime/create fake namespace object */
/******/ 	(() => {
/******/ 		var getProto = Object.getPrototypeOf ? (obj) => (Object.getPrototypeOf(obj)) : (obj) => (obj.__proto__);
/******/ 		var leafPrototypes;
/******/ 		// create a fake namespace object
/******/ 		// mode & 1: value is a module id, require it
/******/ 		// mode & 2: merge all properties of value into the ns
/******/ 		// mode & 4: return value when already ns object
/******/ 		// mode & 16: return value when it's Promise-like
/******/ 		// mode & 8|1: behave like require
/******/ 		__webpack_require__.t = function(value, mode) {
/******/ 			if(mode & 1) value = this(value);
/******/ 			if(mode & 8) return value;
/******/ 			if(typeof value === 'object' && value) {
/******/ 				if((mode & 4) && value.__esModule) return value;
/******/ 				if((mode & 16) && typeof value.then === 'function') return value;
/******/ 			}
/******/ 			var ns = Object.create(null);
/******/ 			__webpack_require__.r(ns);
/******/ 			var def = {};
/******/ 			leafPrototypes = leafPrototypes || [null, getProto({}), getProto([]), getProto(getProto)];
/******/ 			for(var current = mode & 2 && value; typeof current == 'object' && !~leafPrototypes.indexOf(current); current = getProto(current)) {
/******/ 				Object.getOwnPropertyNames(current).forEach((key) => (def[key] = () => (value[key])));
/******/ 			}
/******/ 			def['default'] = () => (value);
/******/ 			__webpack_require__.d(ns, def);
/******/ 			return ns;
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/define property getters */
/******/ 	(() => {
/******/ 		// define getter functions for harmony exports
/******/ 		__webpack_require__.d = (exports, definition) => {
/******/ 			for(var key in definition) {
/******/ 				if(__webpack_require__.o(definition, key) && !__webpack_require__.o(exports, key)) {
/******/ 					Object.defineProperty(exports, key, { enumerable: true, get: definition[key] });
/******/ 				}
/******/ 			}
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/hasOwnProperty shorthand */
/******/ 	(() => {
/******/ 		__webpack_require__.o = (obj, prop) => (Object.prototype.hasOwnProperty.call(obj, prop))
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/make namespace object */
/******/ 	(() => {
/******/ 		// define __esModule on exports
/******/ 		__webpack_require__.r = (exports) => {
/******/ 			if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
/******/ 				Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 			}
/******/ 			Object.defineProperty(exports, '__esModule', { value: true });
/******/ 		};
/******/ 	})();
/******/ 	
/************************************************************************/
var __webpack_exports__ = {};
// This entry need to be wrapped in an IIFE because it need to be in strict mode.
(() => {
"use strict";
/*!*************************!*\
  !*** ./src/js/index.js ***!
  \*************************/
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "App": () => (/* binding */ App)
/* harmony export */ });
/* harmony import */ var _provider_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./provider.js */ "./src/js/provider.js");
/* harmony import */ var _signer_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./signer.js */ "./src/js/signer.js");
/* harmony import */ var _transaction_js__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./transaction.js */ "./src/js/transaction.js");
/* harmony import */ var _validateFormData_js__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./validateFormData.js */ "./src/js/validateFormData.js");
function _typeof(obj) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (obj) { return typeof obj; } : function (obj) { return obj && "function" == typeof Symbol && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }, _typeof(obj); }
function _regeneratorRuntime() { "use strict"; /*! regenerator-runtime -- Copyright (c) 2014-present, Facebook, Inc. -- license (MIT): https://github.com/facebook/regenerator/blob/main/LICENSE */ _regeneratorRuntime = function _regeneratorRuntime() { return exports; }; var exports = {}, Op = Object.prototype, hasOwn = Op.hasOwnProperty, defineProperty = Object.defineProperty || function (obj, key, desc) { obj[key] = desc.value; }, $Symbol = "function" == typeof Symbol ? Symbol : {}, iteratorSymbol = $Symbol.iterator || "@@iterator", asyncIteratorSymbol = $Symbol.asyncIterator || "@@asyncIterator", toStringTagSymbol = $Symbol.toStringTag || "@@toStringTag"; function define(obj, key, value) { return Object.defineProperty(obj, key, { value: value, enumerable: !0, configurable: !0, writable: !0 }), obj[key]; } try { define({}, ""); } catch (err) { define = function define(obj, key, value) { return obj[key] = value; }; } function wrap(innerFn, outerFn, self, tryLocsList) { var protoGenerator = outerFn && outerFn.prototype instanceof Generator ? outerFn : Generator, generator = Object.create(protoGenerator.prototype), context = new Context(tryLocsList || []); return defineProperty(generator, "_invoke", { value: makeInvokeMethod(innerFn, self, context) }), generator; } function tryCatch(fn, obj, arg) { try { return { type: "normal", arg: fn.call(obj, arg) }; } catch (err) { return { type: "throw", arg: err }; } } exports.wrap = wrap; var ContinueSentinel = {}; function Generator() {} function GeneratorFunction() {} function GeneratorFunctionPrototype() {} var IteratorPrototype = {}; define(IteratorPrototype, iteratorSymbol, function () { return this; }); var getProto = Object.getPrototypeOf, NativeIteratorPrototype = getProto && getProto(getProto(values([]))); NativeIteratorPrototype && NativeIteratorPrototype !== Op && hasOwn.call(NativeIteratorPrototype, iteratorSymbol) && (IteratorPrototype = NativeIteratorPrototype); var Gp = GeneratorFunctionPrototype.prototype = Generator.prototype = Object.create(IteratorPrototype); function defineIteratorMethods(prototype) { ["next", "throw", "return"].forEach(function (method) { define(prototype, method, function (arg) { return this._invoke(method, arg); }); }); } function AsyncIterator(generator, PromiseImpl) { function invoke(method, arg, resolve, reject) { var record = tryCatch(generator[method], generator, arg); if ("throw" !== record.type) { var result = record.arg, value = result.value; return value && "object" == _typeof(value) && hasOwn.call(value, "__await") ? PromiseImpl.resolve(value.__await).then(function (value) { invoke("next", value, resolve, reject); }, function (err) { invoke("throw", err, resolve, reject); }) : PromiseImpl.resolve(value).then(function (unwrapped) { result.value = unwrapped, resolve(result); }, function (error) { return invoke("throw", error, resolve, reject); }); } reject(record.arg); } var previousPromise; defineProperty(this, "_invoke", { value: function value(method, arg) { function callInvokeWithMethodAndArg() { return new PromiseImpl(function (resolve, reject) { invoke(method, arg, resolve, reject); }); } return previousPromise = previousPromise ? previousPromise.then(callInvokeWithMethodAndArg, callInvokeWithMethodAndArg) : callInvokeWithMethodAndArg(); } }); } function makeInvokeMethod(innerFn, self, context) { var state = "suspendedStart"; return function (method, arg) { if ("executing" === state) throw new Error("Generator is already running"); if ("completed" === state) { if ("throw" === method) throw arg; return doneResult(); } for (context.method = method, context.arg = arg;;) { var delegate = context.delegate; if (delegate) { var delegateResult = maybeInvokeDelegate(delegate, context); if (delegateResult) { if (delegateResult === ContinueSentinel) continue; return delegateResult; } } if ("next" === context.method) context.sent = context._sent = context.arg;else if ("throw" === context.method) { if ("suspendedStart" === state) throw state = "completed", context.arg; context.dispatchException(context.arg); } else "return" === context.method && context.abrupt("return", context.arg); state = "executing"; var record = tryCatch(innerFn, self, context); if ("normal" === record.type) { if (state = context.done ? "completed" : "suspendedYield", record.arg === ContinueSentinel) continue; return { value: record.arg, done: context.done }; } "throw" === record.type && (state = "completed", context.method = "throw", context.arg = record.arg); } }; } function maybeInvokeDelegate(delegate, context) { var methodName = context.method, method = delegate.iterator[methodName]; if (undefined === method) return context.delegate = null, "throw" === methodName && delegate.iterator["return"] && (context.method = "return", context.arg = undefined, maybeInvokeDelegate(delegate, context), "throw" === context.method) || "return" !== methodName && (context.method = "throw", context.arg = new TypeError("The iterator does not provide a '" + methodName + "' method")), ContinueSentinel; var record = tryCatch(method, delegate.iterator, context.arg); if ("throw" === record.type) return context.method = "throw", context.arg = record.arg, context.delegate = null, ContinueSentinel; var info = record.arg; return info ? info.done ? (context[delegate.resultName] = info.value, context.next = delegate.nextLoc, "return" !== context.method && (context.method = "next", context.arg = undefined), context.delegate = null, ContinueSentinel) : info : (context.method = "throw", context.arg = new TypeError("iterator result is not an object"), context.delegate = null, ContinueSentinel); } function pushTryEntry(locs) { var entry = { tryLoc: locs[0] }; 1 in locs && (entry.catchLoc = locs[1]), 2 in locs && (entry.finallyLoc = locs[2], entry.afterLoc = locs[3]), this.tryEntries.push(entry); } function resetTryEntry(entry) { var record = entry.completion || {}; record.type = "normal", delete record.arg, entry.completion = record; } function Context(tryLocsList) { this.tryEntries = [{ tryLoc: "root" }], tryLocsList.forEach(pushTryEntry, this), this.reset(!0); } function values(iterable) { if (iterable) { var iteratorMethod = iterable[iteratorSymbol]; if (iteratorMethod) return iteratorMethod.call(iterable); if ("function" == typeof iterable.next) return iterable; if (!isNaN(iterable.length)) { var i = -1, next = function next() { for (; ++i < iterable.length;) if (hasOwn.call(iterable, i)) return next.value = iterable[i], next.done = !1, next; return next.value = undefined, next.done = !0, next; }; return next.next = next; } } return { next: doneResult }; } function doneResult() { return { value: undefined, done: !0 }; } return GeneratorFunction.prototype = GeneratorFunctionPrototype, defineProperty(Gp, "constructor", { value: GeneratorFunctionPrototype, configurable: !0 }), defineProperty(GeneratorFunctionPrototype, "constructor", { value: GeneratorFunction, configurable: !0 }), GeneratorFunction.displayName = define(GeneratorFunctionPrototype, toStringTagSymbol, "GeneratorFunction"), exports.isGeneratorFunction = function (genFun) { var ctor = "function" == typeof genFun && genFun.constructor; return !!ctor && (ctor === GeneratorFunction || "GeneratorFunction" === (ctor.displayName || ctor.name)); }, exports.mark = function (genFun) { return Object.setPrototypeOf ? Object.setPrototypeOf(genFun, GeneratorFunctionPrototype) : (genFun.__proto__ = GeneratorFunctionPrototype, define(genFun, toStringTagSymbol, "GeneratorFunction")), genFun.prototype = Object.create(Gp), genFun; }, exports.awrap = function (arg) { return { __await: arg }; }, defineIteratorMethods(AsyncIterator.prototype), define(AsyncIterator.prototype, asyncIteratorSymbol, function () { return this; }), exports.AsyncIterator = AsyncIterator, exports.async = function (innerFn, outerFn, self, tryLocsList, PromiseImpl) { void 0 === PromiseImpl && (PromiseImpl = Promise); var iter = new AsyncIterator(wrap(innerFn, outerFn, self, tryLocsList), PromiseImpl); return exports.isGeneratorFunction(outerFn) ? iter : iter.next().then(function (result) { return result.done ? result.value : iter.next(); }); }, defineIteratorMethods(Gp), define(Gp, toStringTagSymbol, "Generator"), define(Gp, iteratorSymbol, function () { return this; }), define(Gp, "toString", function () { return "[object Generator]"; }), exports.keys = function (val) { var object = Object(val), keys = []; for (var key in object) keys.push(key); return keys.reverse(), function next() { for (; keys.length;) { var key = keys.pop(); if (key in object) return next.value = key, next.done = !1, next; } return next.done = !0, next; }; }, exports.values = values, Context.prototype = { constructor: Context, reset: function reset(skipTempReset) { if (this.prev = 0, this.next = 0, this.sent = this._sent = undefined, this.done = !1, this.delegate = null, this.method = "next", this.arg = undefined, this.tryEntries.forEach(resetTryEntry), !skipTempReset) for (var name in this) "t" === name.charAt(0) && hasOwn.call(this, name) && !isNaN(+name.slice(1)) && (this[name] = undefined); }, stop: function stop() { this.done = !0; var rootRecord = this.tryEntries[0].completion; if ("throw" === rootRecord.type) throw rootRecord.arg; return this.rval; }, dispatchException: function dispatchException(exception) { if (this.done) throw exception; var context = this; function handle(loc, caught) { return record.type = "throw", record.arg = exception, context.next = loc, caught && (context.method = "next", context.arg = undefined), !!caught; } for (var i = this.tryEntries.length - 1; i >= 0; --i) { var entry = this.tryEntries[i], record = entry.completion; if ("root" === entry.tryLoc) return handle("end"); if (entry.tryLoc <= this.prev) { var hasCatch = hasOwn.call(entry, "catchLoc"), hasFinally = hasOwn.call(entry, "finallyLoc"); if (hasCatch && hasFinally) { if (this.prev < entry.catchLoc) return handle(entry.catchLoc, !0); if (this.prev < entry.finallyLoc) return handle(entry.finallyLoc); } else if (hasCatch) { if (this.prev < entry.catchLoc) return handle(entry.catchLoc, !0); } else { if (!hasFinally) throw new Error("try statement without catch or finally"); if (this.prev < entry.finallyLoc) return handle(entry.finallyLoc); } } } }, abrupt: function abrupt(type, arg) { for (var i = this.tryEntries.length - 1; i >= 0; --i) { var entry = this.tryEntries[i]; if (entry.tryLoc <= this.prev && hasOwn.call(entry, "finallyLoc") && this.prev < entry.finallyLoc) { var finallyEntry = entry; break; } } finallyEntry && ("break" === type || "continue" === type) && finallyEntry.tryLoc <= arg && arg <= finallyEntry.finallyLoc && (finallyEntry = null); var record = finallyEntry ? finallyEntry.completion : {}; return record.type = type, record.arg = arg, finallyEntry ? (this.method = "next", this.next = finallyEntry.finallyLoc, ContinueSentinel) : this.complete(record); }, complete: function complete(record, afterLoc) { if ("throw" === record.type) throw record.arg; return "break" === record.type || "continue" === record.type ? this.next = record.arg : "return" === record.type ? (this.rval = this.arg = record.arg, this.method = "return", this.next = "end") : "normal" === record.type && afterLoc && (this.next = afterLoc), ContinueSentinel; }, finish: function finish(finallyLoc) { for (var i = this.tryEntries.length - 1; i >= 0; --i) { var entry = this.tryEntries[i]; if (entry.finallyLoc === finallyLoc) return this.complete(entry.completion, entry.afterLoc), resetTryEntry(entry), ContinueSentinel; } }, "catch": function _catch(tryLoc) { for (var i = this.tryEntries.length - 1; i >= 0; --i) { var entry = this.tryEntries[i]; if (entry.tryLoc === tryLoc) { var record = entry.completion; if ("throw" === record.type) { var thrown = record.arg; resetTryEntry(entry); } return thrown; } } throw new Error("illegal catch attempt"); }, delegateYield: function delegateYield(iterable, resultName, nextLoc) { return this.delegate = { iterator: values(iterable), resultName: resultName, nextLoc: nextLoc }, "next" === this.method && (this.arg = undefined), ContinueSentinel; } }, exports; }
function asyncGeneratorStep(gen, resolve, reject, _next, _throw, key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { Promise.resolve(value).then(_next, _throw); } }
function _asyncToGenerator(fn) { return function () { var self = this, args = arguments; return new Promise(function (resolve, reject) { var gen = fn.apply(self, args); function _next(value) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "next", value); } function _throw(err) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "throw", err); } _next(undefined); }); }; }
function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }
function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, _toPropertyKey(descriptor.key), descriptor); } }
function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); Object.defineProperty(Constructor, "prototype", { writable: false }); return Constructor; }
function _toPropertyKey(arg) { var key = _toPrimitive(arg, "string"); return _typeof(key) === "symbol" ? key : String(key); }
function _toPrimitive(input, hint) { if (_typeof(input) !== "object" || input === null) return input; var prim = input[Symbol.toPrimitive]; if (prim !== undefined) { var res = prim.call(input, hint || "default"); if (_typeof(res) !== "object") return res; throw new TypeError("@@toPrimitive must return a primitive value."); } return (hint === "string" ? String : Number)(input); }




var App = /*#__PURE__*/function () {
  function App() {
    _classCallCheck(this, App);
    this.form = document.getElementById('form');
    this.toWalletAddress = document.getElementById('toWalletAddress');
    this.amount = document.getElementById('amount');
    this.connectBtn = document.getElementById('connect-btn');
    this.fromWalletAddressSpan = document.getElementById('fromWalletAddressSpan');
    this.signer;
  }
  _createClass(App, [{
    key: "runApp",
    value: function () {
      var _runApp = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee3() {
        var _this = this;
        return _regeneratorRuntime().wrap(function _callee3$(_context3) {
          while (1) switch (_context3.prev = _context3.next) {
            case 0:
              _context3.prev = 0;
              _context3.next = 3;
              return this.isConnected();
            case 3:
              this.connectBtn.onclick = /*#__PURE__*/_asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee() {
                return _regeneratorRuntime().wrap(function _callee$(_context) {
                  while (1) switch (_context.prev = _context.next) {
                    case 0:
                      _context.next = 2;
                      return _this.signerConnection();
                    case 2:
                      _context.next = 4;
                      return _this.isConnected();
                    case 4:
                    case "end":
                      return _context.stop();
                  }
                }, _callee);
              }));
              this.form.addEventListener('submit', /*#__PURE__*/function () {
                var _ref2 = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee2(event) {
                  return _regeneratorRuntime().wrap(function _callee2$(_context2) {
                    while (1) switch (_context2.prev = _context2.next) {
                      case 0:
                        event.preventDefault();
                        _context2.next = 3;
                        return _this.transactionProcessing(_this.signer);
                      case 3:
                      case "end":
                        return _context2.stop();
                    }
                  }, _callee2);
                }));
                return function (_x) {
                  return _ref2.apply(this, arguments);
                };
              }());
              _context3.next = 10;
              break;
            case 7:
              _context3.prev = 7;
              _context3.t0 = _context3["catch"](0);
              console.log(_context3.t0.message);
            case 10:
            case "end":
              return _context3.stop();
          }
        }, _callee3, this, [[0, 7]]);
      }));
      function runApp() {
        return _runApp.apply(this, arguments);
      }
      return runApp;
    }() // function to check the connection of Metamask with the site
  }, {
    key: "isConnected",
    value: function () {
      var _isConnected = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee4() {
        var accounts, cutWallet, spanConnectedWallet;
        return _regeneratorRuntime().wrap(function _callee4$(_context4) {
          while (1) switch (_context4.prev = _context4.next) {
            case 0:
              _context4.next = 2;
              return ethereum.request({
                method: 'eth_accounts'
              });
            case 2:
              accounts = _context4.sent;
              if (!accounts.length) {
                _context4.next = 12;
                break;
              }
              cutWallet = accounts[0].slice(35);
              spanConnectedWallet = document.createElement('span');
              this.connectBtn.parentElement.appendChild(spanConnectedWallet);
              spanConnectedWallet.innerText = "Connected with ...".concat(cutWallet);
              this.connectBtn.style.visibility = 'hidden';
              this.fromWalletAddressSpan.innerText = accounts[0];
              _context4.next = 12;
              return this.signerConnection();
            case 12:
            case "end":
              return _context4.stop();
          }
        }, _callee4, this);
      }));
      function isConnected() {
        return _isConnected.apply(this, arguments);
      }
      return isConnected;
    }()
  }, {
    key: "signerConnection",
    value: function () {
      var _signerConnection = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee5() {
        var provider, providerConnected, signerInstance;
        return _regeneratorRuntime().wrap(function _callee5$(_context5) {
          while (1) switch (_context5.prev = _context5.next) {
            case 0:
              // Connection to the provider
              provider = new _provider_js__WEBPACK_IMPORTED_MODULE_0__["default"]();
              console.log("Provider: ".concat(provider));
              _context5.next = 4;
              return provider.blockchainConnection();
            case 4:
              providerConnected = _context5.sent;
              // connection to signer
              signerInstance = new _signer_js__WEBPACK_IMPORTED_MODULE_1__["default"]();
              _context5.next = 8;
              return signerInstance.setSigner(providerConnected);
            case 8:
              this.signer = _context5.sent;
            case 9:
            case "end":
              return _context5.stop();
          }
        }, _callee5, this);
      }));
      function signerConnection() {
        return _signerConnection.apply(this, arguments);
      }
      return signerConnection;
    }()
  }, {
    key: "transactionProcessing",
    value: function () {
      var _transactionProcessing = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee6(signer) {
        var toWalletAddress, transactionAmount, validateFormData, isFormDataValid, tx, transaction, receipt;
        return _regeneratorRuntime().wrap(function _callee6$(_context6) {
          while (1) switch (_context6.prev = _context6.next) {
            case 0:
              console.log('prevent default ok');
              console.log('signer:', signer);
              toWalletAddress = this.toWalletAddress.value;
              transactionAmount = this.amount.value;
              _context6.prev = 4;
              if (!(toWalletAddress && transactionAmount)) {
                _context6.next = 26;
                break;
              }
              console.log('entrou no if');
              validateFormData = new _validateFormData_js__WEBPACK_IMPORTED_MODULE_3__["default"](toWalletAddress, transactionAmount);
              isFormDataValid = validateFormData.validateData();
              if (signer) {
                _context6.next = 13;
                break;
              }
              console.log('signer não válido', signer);
              window.alert("Metamask is not connected");
              return _context6.abrupt("return");
            case 13:
              if (!isFormDataValid) {
                _context6.next = 24;
                break;
              }
              console.log('form validado');
              tx = new _transaction_js__WEBPACK_IMPORTED_MODULE_2__["default"](signer, toWalletAddress, transactionAmount);
              _context6.next = 18;
              return tx.createTransaction();
            case 18:
              transaction = _context6.sent;
              console.log(transaction);

              // Wait for the transaction to be written in the blockchain
              _context6.next = 22;
              return transaction.wait();
            case 22:
              receipt = _context6.sent;
              console.log(receipt);
            case 24:
              _context6.next = 27;
              break;
            case 26:
              window.alert('Dados inválidos.');
            case 27:
              _context6.next = 32;
              break;
            case 29:
              _context6.prev = 29;
              _context6.t0 = _context6["catch"](4);
              console.log(_context6.t0.message);
            case 32:
            case "end":
              return _context6.stop();
          }
        }, _callee6, this, [[4, 29]]);
      }));
      function transactionProcessing(_x2) {
        return _transactionProcessing.apply(this, arguments);
      }
      return transactionProcessing;
    }()
  }]);
  return App;
}();
var app = new App();
app.runApp();
})();

/******/ })()
;
//# sourceMappingURL=bundle.js.map