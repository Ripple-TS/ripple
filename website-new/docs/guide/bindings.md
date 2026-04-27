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

```ripple
import { bindValue, track } from 'ripple';

export component App() {
  let &[name, nameTracked] = track('');

  <div>
    <input
      type="text"
      {ref bindValue(nameTracked)}
      placeholder="Enter your name"
    />
    <p>
      {'Hello, '}
      {name || 'stranger'}
      {'!'}
    </p>
    <button onClick={() => (name = '')}>{'Clear'}</button>
  </div>
}
```

</Code>

**For number inputs:**

<Code>

```ripple
import { bindValue, track } from 'ripple';

export component App() {
  let &[age, ageTracked] = track(0);

  <div>
    <input type="number" {ref bindValue(ageTracked)} min="0" max="120" />
    <p>
      {'Age: '}
      {age}
      {' years old'}
    </p>
    <button onClick={() => (age = age + 1)}>"Increment"</button>
  </div>
}
```

</Code>

**For select elements:**

<Code>

```ripple
import { bindValue, track } from 'ripple';

export component App() {
  let &[selectedFruit, selectedFruitTracked] = track('apple');

  <div>
    <select {ref bindValue(selectedFruitTracked)}>
      <option value="apple">{'Apple'}</option>
      <option value="banana">{'Banana'}</option>
      <option value="cherry">{'Cherry'}</option>
      <option value="durian">{'Durian'}</option>
    </select>
    <p>
      {'You selected: '}
      {selectedFruit}
    </p>
  </div>
}
```

</Code>

**For multiple select:**

<Code>

```ripple
import { bindValue, track } from 'ripple';

export component App() {
  let &[selectedColors, selectedColorsTracked] = track(['red', 'blue']);

  <div>
    <select multiple {ref bindValue(selectedColorsTracked)} style="height: 100px">
      <option value="red">{'Red'}</option>
      <option value="green">{'Green'}</option>
      <option value="blue">{'Blue'}</option>
      <option value="yellow">{'Yellow'}</option>
    </select>
    <p>
      {'Selected colors: '}
      {selectedColors.join(', ')}
    </p>
  </div>
}
```

</Code>

### bindChecked

The `bindChecked` binding synchronizes a checkbox's checked state with a tracked
boolean value.

<Code>

```ripple
import { bindChecked, track } from 'ripple';

export component App() {
  let &[agreed, agreedTracked] = track(false);

  <div>
    <label>
      <input type="checkbox" {ref bindChecked(agreedTracked)} />
      {' I agree to the terms and conditions'}
    </label>
    <p>
      {'Status: '}
      {agreed ? 'Agreed' : 'Not agreed'}
    </p>
    <button disabled={!agreed}>{'Submit'}</button>
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

```ripple
import { bindChecked, bindIndeterminate, track } from 'ripple';

export component App() {
  let &[checked, checkedTracked] = track(false);
  let &[indeterminate, indeterminateTracked] = track(true);

  <div>
    <label>
      <input
        type="checkbox"
        {ref bindChecked(checkedTracked)}
        {ref bindIndeterminate(indeterminateTracked)}
      />
      {' Select All'}
    </label>
    <p>
      {'Checked: '}
      {checked ? 'Yes' : 'No'}
    </p>
    <p>
      {'Indeterminate: '}
      {indeterminate ? 'Yes' : 'No'}
    </p>
    <button
      onClick={() => {
        indeterminate = !indeterminate;
        if (indeterminate) {
          checked = false;
        }
      }}
    >
      {'Toggle Indeterminate'}
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

```ripple
import { bindGroup, track } from 'ripple';

export component App() {
  let &[hobbies, hobbiesTracked] = track(['reading']);

  <div>
    <label>
      <input type="checkbox" value="reading" {ref bindGroup(hobbiesTracked)} />
      {' Reading'}
    </label>
    <label>
      <input type="checkbox" value="gaming" {ref bindGroup(hobbiesTracked)} />
      {' Gaming'}
    </label>
    <label>
      <input type="checkbox" value="sports" {ref bindGroup(hobbiesTracked)} />
      {' Sports'}
    </label>
    <label>
      <input type="checkbox" value="cooking" {ref bindGroup(hobbiesTracked)} />
      {' Cooking'}
    </label>
    <p>
      {'Selected: '}
      {hobbies.join(', ') || 'none'}
    </p>
  </div>

  <button onClick={() => (hobbies = ['reading'])}>"Reset"</button>
}
```

</Code>

**For radio button groups (value binding):**

<Code>

```ripple
import { bindGroup, track } from 'ripple';

export component App() {
  let &[size, sizeTracked] = track('medium');

  <div>
    <label>
      <input type="radio" name="size" value="small" {ref bindGroup(sizeTracked)} />
      {' Small'}
    </label>
    <label>
      <input type="radio" name="size" value="medium" {ref bindGroup(sizeTracked)} />
      {' Medium'}
    </label>
    <label>
      <input type="radio" name="size" value="large" {ref bindGroup(sizeTracked)} />
      {' Large'}
    </label>
    <p>{'Selected size: '}{size}</p>
  </div>

  <button onClick={() => size = 'medium'>{'Reset to "medium"'}</button>
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

```ripple
import { bindFiles, bindNode, track } from 'ripple';

export component App() {
  let &[files, filesTracked] = track();
  let &[version] = track(0);
  let &[input, inputTracked] = track();

  const clearFiles = () => {
    files = new DataTransfer().files; // null or undefined does not work
    input.value = null; // reset the input selected message
  };

  const createSampleFile = () => {
    version++;
    const dt = new DataTransfer();
    const file = new File([
      `Hello, World version: ${version}!`,
    ], `sample_${version}.txt`, {
      type: 'text/plain',
    });
    dt.items.add(file);
    for (const file of files ?? []) {
      dt.items.add(file);
    }
    files = dt.files;
  };

  <div>
    <input
      type="file"
      {ref bindFiles(filesTracked)}
      {ref bindNode(inputTracked)}
      multiple
    />

    <div>
      if (files && files.length > 0) {
        <p>{'Selected files:'}</p>
        <ul>
          for (const file of Array.from(files)) {
            <li>
              {file.name}
              {' ('}
              {file.size}
              {' bytes)'}
            </li>
          }
        </ul>
      } else {
        <p>{'No files selected'}</p>
      }
    </div>

    <button onClick={clearFiles}>{'Clear files'}</button>
    <button onClick={createSampleFile}>{'Add sample file'}</button>
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
  files = dt.files;
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

```ripple
import { bindClientWidth, bindClientHeight, track } from 'ripple';

export component App() {
  let &[width, widthTracked] = track(0);
  let &[height, heightTracked] = track(0);

  <div>
    <div
      {ref bindClientWidth(widthTracked)}
      {ref bindClientHeight(heightTracked)}
      style={{
        resize: 'both',
        overflow: 'auto',
        border: '2px solid blue',
        padding: '20px',
        minWidth: '200px',
        minHeight: '100px',
      }}
    >
      {'Resize me! (drag bottom-right corner)'}
      <p>
        {'Client Width: '}
        {width}
        {'px'}
      </p>
      <p>
        {'Client Height: '}
        {height}
        {'px'}
      </p>
    </div>
  </div>
}
```

</Code>

### bindOffsetWidth / bindOffsetHeight

These bindings track the full outer dimensions of an element (including borders).

<Code>

```ripple
import { bindOffsetWidth, bindOffsetHeight, track } from 'ripple';

export component App() {
  let &[width, widthTracked] = track(0);
  let &[height, heightTracked] = track(0);

  <div>
    <div
      {ref bindOffsetWidth(widthTracked)}
      {ref bindOffsetHeight(heightTracked)}
      style={{
        border: '10px solid green',
        padding: '20px',
        width: '300px',
        height: '150px',
      }}
    >
      {'Box with borders'}
    </div>
    <p>
      {'Offset Width: '}
      {width}
      {'px (includes borders)'}
    </p>
    <p>
      {'Offset Height: '}
      {height}
      {'px (includes borders)'}
    </p>
  </div>
}
```

</Code>

## ResizeObserver Bindings

### bindContentRect

Tracks the element's content rectangle from the ResizeObserver API.

<Code>

```ripple
import { bindContentRect, track } from 'ripple';

export component App() {
  let &[rect, rectTracked] = track({ width: 0, height: 0, top: 0, left: 0 });

  <div>
    <div
      {ref bindContentRect(rectTracked)}
      style={{
        resize: 'both',
        overflow: 'auto',
        border: '2px solid purple',
        padding: '20px',
        minWidth: '200px',
        minHeight: '100px',
      }}
    >
      {'Resize me!'}
    </div>
    <pre>{JSON.stringify(rect, null, 2)}</pre>
  </div>
}
```

</Code>

### bindContentBoxSize

Tracks the content box size (without padding or borders).

<Code>

```ripple
import { bindContentBoxSize, track } from 'ripple';

export component App() {
  let &[size, sizeTracked] = track([]);

  <div>
    <div
      {ref bindContentBoxSize(sizeTracked)}
      style={{
        border: '5px solid orange',
        padding: '15px',
        width: '250px',
        height: '100px',
      }}
    >
      {'Content box size'}
    </div>
    <pre>
      {'Block size: '}
      {size[0]?.blockSize || 0}
      {'px\n'}
      {'Inline size: '}
      {size[0]?.inlineSize || 0}
      {'px'}
    </pre>
  </div>
}
```

</Code>

### bindBorderBoxSize

Tracks the border box size (including padding and borders).

<Code>

```ripple
import { bindBorderBoxSize, track } from 'ripple';

export component App() {
  let &[size, sizeTracked] = track([]);

  <div>
    <div
      {ref bindBorderBoxSize(sizeTracked)}
      style={{
        border: '5px solid teal',
        padding: '15px',
        width: '250px',
        height: '100px',
      }}
    >
      {'Border box size'}
    </div>
    <pre>
      {'Block size: '}
      {size[0]?.blockSize || 0}
      {'px\n'}
      {'Inline size: '}
      {size[0]?.inlineSize || 0}
      {'px'}
    </pre>
  </div>
}
```

</Code>

### bindDevicePixelContentBoxSize

Tracks the content box size in device pixels (useful for high-DPI displays).

<Code>

```ripple
import { bindDevicePixelContentBoxSize, track } from 'ripple';

export component App() {
  let &[size, sizeTracked] = track([]);

  <div>
    <div
      {ref bindDevicePixelContentBoxSize(sizeTracked)}
      style={{
        border: '3px solid crimson',
        padding: '10px',
        width: '200px',
        height: '80px',
      }}
    >
      {'Device pixel content box'}
    </div>
    <pre>
      {'Block size: '}
      {size[0]?.blockSize || 0}
      {'px\n'}
      {'Inline size: '}
      {size[0]?.inlineSize || 0}
      {'px'}
    </pre>
  </div>
}
```

</Code>

## Content Editable Bindings

### bindInnerHTML

Binds to an element's innerHTML property, useful for rich text editors.

<Code>

```ripple
import { bindInnerHTML, track } from 'ripple';

export component App() {
  let &[content, contentTracked] = track('<strong>Bold text</strong>');

  <div>
    <div
      contentEditable={true}
      {ref bindInnerHTML(contentTracked)}
      style={{
        border: '1px solid gray',
        padding: '10px',
        minHeight: '50px',
      }}
    />
    <p>{'Raw HTML:'}</p>
    <pre>{content}</pre>
  </div>
}
```

</Code>

### bindInnerText

Binds to an element's innerText property (text with line breaks, no HTML).

<Code>

```ripple
import { bindInnerText, track } from 'ripple';

export component App() {
  let &[text, textTracked] = track('Edit me!');

  <div>
    <div
      contentEditable={true}
      {ref bindInnerText(textTracked)}
      style={{
        border: '1px solid gray',
        padding: '10px',
        minHeight: '50px',
      }}
    />
    <p>
      {'Text content: '}
      {text}
    </p>
  </div>
}
```

</Code>

### bindTextContent

Binds to an element's textContent property (raw text, no formatting).

<Code>

```ripple
import { bindTextContent, track } from 'ripple';

export component App() {
  let &[text, textTracked] = track('Type here');

  <div>
    <div
      contentEditable={true}
      {ref bindTextContent(textTracked)}
      style={{
        border: '1px solid gray',
        padding: '10px',
        minHeight: '50px',
        whiteSpace: 'pre-wrap',
      }}
    />
    <p>
      {'Text content: '}
      {text}
    </p>
  </div>
}
```

</Code>

## Element Reference Binding

### bindNode

A convenient way to get a reference to a DOM element.

<Code>

```ripple
import { bindNode, track } from 'ripple';

export component App() {
  let &[divElement, divElementTracked] = track();

  const handleFocus = () => {
    if (divElement) {
      divElement.focus();
      divElement.style.backgroundColor = 'lightblue';
    }
  };

  <div>
    <div
      {ref bindNode(divElementTracked)}
      tabIndex={0}
      style={{
        border: '2px solid navy',
        padding: '20px',
        outline: 'none',
      }}
    >
      {'Click the button to focus this div'}
    </div>
    <button onClick={handleFocus}>{'Focus Div'}</button>
  </div>
}
```

</Code>

## Combining Multiple Bindings

You can use multiple bindings on the same element by applying multiple `{ref}`
attributes:

<Code>

```ripple
import { bindValue, bindClientWidth, bindNode, track } from 'ripple';

export component App() {
  let &[text, textTracked] = track('');
  let &[width, widthTracked] = track(0);
  let &[inputElement, inputElementTracked] = track();

  const logInfo = () => {
    console.log('Input:', inputElement);
    console.log('Value:', text);
    console.log('Width:', width);
  };

  <div>
    <input
      type="text"
      {ref bindValue(textTracked)}
      {ref bindClientWidth(widthTracked)}
      {ref bindNode(inputElementTracked)}
      placeholder="Type something..."
      style="width: 300px"
    />
    <p>{'Text: '}{text}</p>
    <p>{'Width: '}{width}{'px'}</p></p>
    <button onClick={logInfo}>{'Log Info'}</button>
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

5. **Multiple refs**: You can apply multiple `{ref}` attributes to the same
   element for different bindings.
