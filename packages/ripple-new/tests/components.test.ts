import { describe, it, expect } from 'vitest';
import { mount } from './_helpers';
import { Greeting, App, Nested, DefaultOnly } from './_fixtures/components.tsrx';

describe('component composition', () => {
  it('renders a static child component with props', () => {
    const r = mount(Greeting, { name: 'world' });
    expect(r.find('.lbl').textContent).toBe('world');
    r.unmount();
  });
});

describe('createContext + use', () => {
  it('reads default when no Provider is in the tree', () => {
    const r = mount(DefaultOnly);
    expect(r.find('.theme').textContent).toBe('light');
    r.unmount();
  });

  it('reads Provider value, updates when value changes', () => {
    const r = mount(App);
    expect(r.find('.theme').textContent).toBe('light');
    r.click('button');
    expect(r.find('.theme').textContent).toBe('dark');
    r.click('button');
    expect(r.find('.theme').textContent).toBe('light');
    r.unmount();
  });

  it('inner Provider overrides outer', () => {
    const r = mount(Nested);
    expect(r.find('.o .theme').textContent).toBe('outer');
    expect(r.find('.i .theme').textContent).toBe('inner');
    r.unmount();
  });
});
