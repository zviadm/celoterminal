// Code should use nowMs instead of Date.now() directly, since nowMs
// allows test code to adjust time, for timing sensitive test scenarios.
let _adjustedMS = 0
export const nowMS = (): number => {
	return Date.now() + _adjustedMS
}

export const testOnlyAdjustNow = (increaseMS: number): void => {
	_adjustedMS += increaseMS
}