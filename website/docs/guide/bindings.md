---
title: Bindings in Ripple
---

# Bindings

Bindings in Ripple provide a declarative way to synchronize DOM element properties
with reactive state. Instead of manually handling events and updates, bindings
create a two-way connection between your tracked variables and DOM elements.

::: info All binding functions require a `Tracked` object as their argument. If
you pass a non-tracked value, they will throw a `TypeError`.
:::

## Form Bindings

### bindValue

The `bindValue` binding creates a two-way connection between a tracked variable
and an input or select element's value.

**For text inputs:**

<Code>

```tsrx
import { bindValue, track } from 'ripple';

export function App() @{
  const name = track('');

  <div>
    <input
      type="text"
      ref={bindValue(name)}
      placeholder="Enter your name"
    />
    <p>Hello, {name.value || 'stranger'}!</p>
    <button onClick={() => (name.value = '')}>Clear</button>
  </div>
}
```

</Code>

**For number inputs:**

<Code>

```tsrx
import { bindValue, track } from 'ripple';

export function App() @{
  const age = track(0);

  <div>
    <input type="number" ref={bindValue(age)} min="0" max="120" />
    <p>Age: {age.value} years old</p>
    <button onClick={() => (age.value = age.value + 1)}>Increment</button>
  </div>
}
```

</Code>

**For select elements:**

<Code>

```tsrx
import { bindValue, track } from 'ripple';

export function App() @{
  const selectedFruit = track('apple');

  <div>
    <select ref={bindValue(selectedFruit)}>
      <option value="apple">Apple</option>
      <option value="banana">Banana</option>
      <option value="cherry">Cherry</option>
      <option value="durian">Durian</option>
    </select>
    <p>You selected: {selectedFruit.value}</p>
  </div>
}
```

</Code>

**For multiple select:**

<Code>

```tsrx
import { bindValue, track } from 'ripple';

export function App() @{
  const selectedColors = track(['red', 'blue']);

  <div>
    <select multiple ref={bindValue(selectedColors)} style="height: 100px">
      <option value="red">Red</option>
      <option value="green">Green</option>
      <option value="blue">Blue</option>
      <option value="yellow">Yellow</option>
    </select>
    <p>Selected colors: {selectedColors.value.join(', ')}</p>
  </div>
}
```

</Code>

### bindChecked

The `bindChecked` binding synchronizes a checkbox's checked state with a tracked
boolean value.

<Code>

```tsrx
import { bindChecked, track } from 'ripple';

export function App() @{
  const agreed = track(false);

  <div>
    <label>
      <input type="checkbox" ref={bindChecked(agreed)} />
       I agree to the terms and conditions
    </label>
    <p>Status: {agreed.value ? 'Agreed' : 'Not agreed'}</p>
    <button disabled={!agreed.value}>Submit</button>
  </div>
}
```

</Code>

::: info Note

- `bindChecked` only supports individual checkbox boolean binding. For checkbox
  groups or radio buttons, use `bindGroup` instead.

- For `radio` inputs, use `bindGroup` instead of `bindChecked`.

:::

### bindIndeterminate

The `bindIndeterminate` binding synchronizes a checkbox's indeterminate state with
a tracked boolean value. The indeterminate state is commonly used for "select all"
checkboxes when only some (but not all) child items are selected.

<Code>

```tsrx
import { bindChecked, bindIndeterminate, track } from 'ripple';

export function App() @{
  const checked = track(false);
  const indeterminate = track(true);

  <div>
    <label>
      <input
        type="checkbox"
        ref={[bindChecked(checked), bindIndeterminate(indeterminate)]}
      />
       Select All
    </label>
    <p>Checked: {checked.value ? 'Yes' : 'No'}</p>
    <p>Indeterminate: {indeterminate.value ? 'Yes' : 'No'}</p>
    <button
      onClick={() => {
        indeterminate.value = !indeterminate.value;
        if (indeterminate.value) {
          checked.value = false;
        }
      }}
    >
      Toggle Indeterminate
    </button>
  </div>
}
```

</Code>

::: info Note

- The indeterminate state is purely visual and doesn't affect the checkbox's
  checked value.
- You can combine `bindIndeterminate` with `bindChecked` on the same checkbox.
- Common use case: "Select All" checkboxes when some (but not all) items are
  selected.

:::

### bindGroup

The `bindGroup` binding allows you to bind a group of checkboxes to an array or a
group of radio buttons to a single value. This is essential for handling multiple
selections or mutually exclusive choices.

**For checkbox groups (array binding):**

<Code>

```tsrx
import { bindGroup, track } from 'ripple';

export function App() @{
  const hobbies = track(['reading']);

  <div>
    <label>
      <input type="checkbox" value="reading" ref={bindGroup(hobbies)} />
       Reading
    </label>
    <label>
      <input type="checkbox" value="gaming" ref={bindGroup(hobbies)} />
       Gaming
    </label>
    <label>
      <input type="checkbox" value="sports" ref={bindGroup(hobbies)} />
       Sports
    </label>
    <label>
      <input type="checkbox" value="cooking" ref={bindGroup(hobbies)} />
       Cooking
    </label>
    <p>Selected: {hobbies.value.join(', ') || 'none'}</p>
    <button onClick={() => (hobbies.value = ['reading'])}>Reset</button>
  </div>
}
```

</Code>

**For radio button groups (value binding):**

<Code>

```tsrx
import { bindGroup, track } from 'ripple';

export function App() @{
  const size = track('medium');

  <div>
    <label>
      <input type="radio" name="size" value="small" ref={bindGroup(size)} />
       Small
    </label>
    <label>
      <input type="radio" name="size" value="medium" ref={bindGroup(size)} />
       Medium
    </label>
    <label>
      <input type="radio" name="size" value="large" ref={bindGroup(size)} />
       Large
    </label>
    <p>Selected size: {size.value}</p>
    <button onClick={() => size.value = 'medium'}>Reset to &quot;medium&quot;</button>
  </div>
}
```

</Code>

::: info Note

- **Checkboxes**: The tracked value should be an array. Checked boxes add their
  values to the array.
- **Radio buttons**: The tracked value should be a single value matching one of
  the radio button values.
- **Static values only**: The `value` attribute of inputs should be static.
  Dynamic/reactive value attributes are not supported. If you need to change input
  values dynamically, you must manually update both the tracked value and the
  checkbox states.
- **Per-binding instances**: Ripple's `bindGroup` doesn't require inputs to be in
  the same component since it uses per-binding instance groups.

:::

### bindFiles

The `bindFiles` binding creates a two-way connection between a tracked variable
and a file input's selected files. This allows you to read selected files and
programmatically update the file input.

<Code>

```tsrx
import { bindFiles, bindNode, track } from 'ripple';

export function App() @{
  const files = track();
  const version = track(0);
  const input = track();

  const clearFiles = () => {
    files.value = new DataTransfer().files; // null or undefined does not work
    input.value.value = null; // reset the input selected message
  };

  const createSampleFile = () => {
    version.value++;
    const dt = new DataTransfer();
    const file = new File([
      `Hello, World version: ${version.value}!`,
    ], `sample_${version.value}.txt`, {
      type: 'text/plain',
    });
    dt.items.add(file);
    for (const file of files.value ?? []) {
      dt.items.add(file);
    }
    files.value = dt.files;
  };

  <div>
    <input
      type="file"
      ref={[bindFiles(files), bindNode(input)]}
      multiple
    />

    <div>
      @if (files.value && files.value.length > 0) {
        <>
          <p>Selected files:</p>
          <ul>
            @for (const file of Array.from(files.value)) {
              <li>{file.name} ({file.size} bytes)</li>
            }
          </ul>
        </>
      } @else {
        <p>No files selected</p>
      }
    </div>

    <button onClick={clearFiles}>Clear files</button>
    <button onClick={createSampleFile}>Add sample file</button>
  </div>
}
```

</Code>

::: info Note

- `FileList` objects are read-only and cannot be modified directly.
- To programmatically set files, create a new `DataTransfer` object and use its
  `files` property:
  ```js
  const dt = new DataTransfer();
  dt.items.add(new File(['content'], 'filename.txt'));
  files.value = dt.files;
  ```
- To clear files, set the value to `new DataTransfer().files` (setting to `null`
  or `undefined` will not work for clearing).
- `DataTransfer` may not be available in server-side JS runtimes. Leave the
  tracked value uninitialized to prevent errors during SSR.

:::

## Dimension Bindings

### bindClientWidth / bindClientHeight

These bindings track the inner dimensions of an element (excluding borders and
scrollbars).

<Code>

```tsrx
import { bindClientWidth, bindClientHeight, track } from 'ripple';

export function App() @{
  const width = track(0);
  const height = track(0);

  <div
    ref={[bindClientWidth(width), bindClientHeight(height)]}
    style={{
      resize: 'both',
      overflow: 'auto',
      border: '2px solid blue',
      padding: '20px',
      minWidth: '200px',
      minHeight: '100px',
    }}
  >
    Resize me! (drag bottom-right corner)
    <p>Client Width: {width.value}px</p>
    <p>Client Height: {height.value}px</p>
  </div>
}
```

</Code>

### bindOffsetWidth / bindOffsetHeight

These bindings track the full outer dimensions of an element (including borders).

<Code>

```tsrx
import { bindOffsetWidth, bindOffsetHeight, track } from 'ripple';

export function App() @{
  const width = track(0);
  const height = track(0);

  <>
    <div
      ref={[bindOffsetWidth(width), bindOffsetHeight(height)]}
      style={{
        border: '10px solid green',
        padding: '20px',
        width: '300px',
        height: '150px',
      }}
    >
      Box with borders
    </div>
    <p>Offset Width: {width.value}px (includes borders)</p>
    <p>Offset Height: {height.value}px (includes borders)</p>
  </>
}
```

</Code>

## ResizeObserver Bindings

### bindContentRect

Tracks the element's content rectangle from the ResizeObserver API.

<Code>

```tsrx
import { bindContentRect, track } from 'ripple';

export function App() @{
  const rect = track({ width: 0, height: 0, top: 0, left: 0 });

  <>
    <div
      ref={bindContentRect(rect)}
      style={{
        resize: 'both',
        overflow: 'auto',
        border: '2px solid purple',
        padding: '20px',
        minWidth: '200px',
        minHeight: '100px',
      }}
    >
      Resize me!
    </div>
    <pre>{JSON.stringify(rect.value, null, 2)}</pre>
  </>
}
```

</Code>

### bindContentBoxSize

Tracks the content box size (without padding or borders).

<Code>

```tsrx
import { bindContentBoxSize, track } from 'ripple';

export function App() @{
  const size = track([]);

  <>
    <div
      ref={bindContentBoxSize(size)}
      style={{
        border: '5px solid orange',
        padding: '15px',
        width: '250px',
        height: '100px',
      }}
    >
      Content box size
    </div>
    <pre>
      Block size: {size.value[0]?.blockSize || 0}px
      <br />
      Inline size: {size.value[0]?.inlineSize || 0}px
    </pre>
  </>

}
```

</Code>

### bindBorderBoxSize

Tracks the border box size (including padding and borders).

<Code>

```tsrx
import { bindBorderBoxSize, track } from 'ripple';

export function App() @{
  const size = track([]);

  <>
    <div
      ref={bindBorderBoxSize(size)}
      style={{
        border: '5px solid teal',
        padding: '15px',
        width: '250px',
        height: '100px',
      }}
    >
      Border box size
    </div>
    <pre>
      Block size: {size.value[0]?.blockSize || 0}px
      <br />
      Inline size: {size.value[0]?.inlineSize || 0}px
    </pre>
  </>
}
```

</Code>

### bindDevicePixelContentBoxSize

Tracks the content box size in device pixels (useful for high-DPI displays).

<Code>

```tsrx
import { bindDevicePixelContentBoxSize, track } from 'ripple';

export function App() @{
  const size = track([]);

  <>
    <div
      ref={bindDevicePixelContentBoxSize(size)}
      style={{
        border: '3px solid crimson',
        padding: '10px',
        width: '200px',
        height: '80px',
      }}
    >
      Device pixel content box
    </div>
    <pre>
      Block size: {size.value[0]?.blockSize || 0}px
      <br />
      Inline size: {size.value[0]?.inlineSize || 0}px
    </pre>
  </>
}
```

</Code>

## Content Editable Bindings

### bindInnerHTML

Binds to an element's innerHTML property, useful for rich text editors.

<Code>

```tsrx
import { bindInnerHTML, track } from 'ripple';

export function App() @{
  const content = track('<strong>Bold text</strong>');

  <>
    <div
      contentEditable={true}
      ref={bindInnerHTML(content)}
      style={{
        border: '1px solid gray',
        padding: '10px',
        minHeight: '50px',
      }}
    />
    <p>Raw HTML:</p>
    <pre>{content.value}</pre>
  </>

}
```

</Code>

### bindInnerText

Binds to an element's innerText property (text with line breaks, no HTML).

<Code>

```tsrx
import { bindInnerText, track } from 'ripple';

export function App() @{
  const text = track('Edit me!');

  <>
    <div
      contentEditable={true}
      ref={bindInnerText(text)}
      style={{
        border: '1px solid gray',
        padding: '10px',
        minHeight: '50px'
      }}
    />
    <p>Text content: {text.value}</p>
  </>
}
```

</Code>

### bindTextContent

Binds to an element's textContent property (raw text, no formatting).

<Code>

```tsrx
import { bindTextContent, track } from 'ripple';

export function App() @{
  const text = track('Type here');

  <>
    <div
      contentEditable={true}
      ref={bindTextContent(text)}
      style={{
        border: '1px solid gray',
        padding: '10px',
        minHeight: '50px',
        whiteSpace: 'pre-wrap'
      }}
    />
    <p>Text content: {text.value}</p>
  </>

}
```

</Code>

## Element Reference Binding

### bindNode

A convenient way to get a reference to a DOM element.

<Code>

```tsrx
import { bindNode, track } from 'ripple';

export function App() @{
  const divElement = track();

  const handleFocus = () => {
    if (divElement.value) {
      divElement.value.focus();
      divElement.value.style.backgroundColor = 'lightblue';
    }
  };

  <>
    <div
      ref={bindNode(divElement)}
      tabIndex={0}
      style={{
        border: '2px solid navy',
        padding: '20px',
        outline: 'none',
      }}
    >
      Click the button to focus this div
    </div>
    <button onClick={handleFocus}>Focus Div</button>
  </>
}
```

</Code>

## Combining Multiple Bindings

You can use multiple bindings on the same element with one array-valued `ref`
attribute:

<Code>

```tsrx
import { bindValue, bindClientWidth, bindNode, track } from 'ripple';

export function App() @{
  const text = track('');
  const width = track(0);
  const inputElement = track();

  const logInfo = () => {
    console.log('Input:', inputElement.value);
    console.log('Value:', text.value);
    console.log('Width:', width.value);
  };

  <div>
    <input
      type="text"
      ref={[
        bindValue(text),
        bindClientWidth(width),
        bindNode(inputElement),
      ]}
      placeholder="Type something..."
      style="width: 300px"
    />
    <p>Text: {text.value}</p>
    <p>Width: {width.value}px</p>
    <button onClick={logInfo}>Log Info</button>
  </div>

}
```

</Code>

## Best Practices

1. **Always use tracked variables**: All binding functions require `Tracked`
   objects created with `track()`.

2. **Cleanup is automatic**: Bindings automatically handle cleanup when elements
   are removed from the DOM.

3. **Performance**: Bindings use efficient observers (ResizeObserver for
   dimensions) with singleton patterns to minimize overhead.

4. **Type safety**: For number inputs, `bindValue` automatically converts values
   to numbers.

5. **Multiple refs**: Use an array-valued `ref` to apply several bindings to the same
   element.
