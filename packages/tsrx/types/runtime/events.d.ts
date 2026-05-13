export function event_name_from_capture(event_name: string): string;
export function get_attribute_event_name(
	name: string,
	handler: EventListener | { customName?: string },
): string;
export function get_original_event_name(name: string): string;
export function is_capture_event(event_name: string): boolean;
export function is_event_attribute(attr: string): boolean;
export function is_non_delegated(event_name: string): boolean;
export function is_passive_event(name: string): boolean;
export function normalize_event_name(name: string): string;
