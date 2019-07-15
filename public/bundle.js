
(function(l, i, v, e) { v = l.createElement(i); v.async = 1; v.src = '//' + (location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; e = l.getElementsByTagName(i)[0]; e.parentNode.insertBefore(v, e)})(document, 'script');
function noop() { }
const identity = x => x;
function assign(tar, src) {
    // @ts-ignore
    for (const k in src)
        tar[k] = src[k];
    return tar;
}
function is_promise(value) {
    return value && typeof value === 'object' && typeof value.then === 'function';
}
function add_location(element, file, line, column, char) {
    element.__svelte_meta = {
        loc: { file, line, column, char }
    };
}
function run(fn) {
    return fn();
}
function blank_object() {
    return Object.create(null);
}
function run_all(fns) {
    fns.forEach(run);
}
function is_function(thing) {
    return typeof thing === 'function';
}
function safe_not_equal(a, b) {
    return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
}
function validate_store(store, name) {
    if (!store || typeof store.subscribe !== 'function') {
        throw new Error(`'${name}' is not a store with a 'subscribe' method`);
    }
}
function subscribe(component, store, callback) {
    const unsub = store.subscribe(callback);
    component.$$.on_destroy.push(unsub.unsubscribe
        ? () => unsub.unsubscribe()
        : unsub);
}
const is_client = typeof window !== 'undefined';
let now = is_client
    ? () => window.performance.now()
    : () => Date.now();
let raf = is_client ? requestAnimationFrame : noop;

const tasks = new Set();
let running = false;
function run_tasks() {
    tasks.forEach(task => {
        if (!task[0](now())) {
            tasks.delete(task);
            task[1]();
        }
    });
    running = tasks.size > 0;
    if (running)
        raf(run_tasks);
}
function loop(fn) {
    let task;
    if (!running) {
        running = true;
        raf(run_tasks);
    }
    return {
        promise: new Promise(fulfil => {
            tasks.add(task = [fn, fulfil]);
        }),
        abort() {
            tasks.delete(task);
        }
    };
}

function append(target, node) {
    target.appendChild(node);
}
function insert(target, node, anchor) {
    target.insertBefore(node, anchor || null);
}
function detach(node) {
    node.parentNode.removeChild(node);
}
function destroy_each(iterations, detaching) {
    for (let i = 0; i < iterations.length; i += 1) {
        if (iterations[i])
            iterations[i].d(detaching);
    }
}
function element(name) {
    return document.createElement(name);
}
function svg_element(name) {
    return document.createElementNS('http://www.w3.org/2000/svg', name);
}
function text(data) {
    return document.createTextNode(data);
}
function space() {
    return text(' ');
}
function empty() {
    return text('');
}
function listen(node, event, handler, options) {
    node.addEventListener(event, handler, options);
    return () => node.removeEventListener(event, handler, options);
}
function attr(node, attribute, value) {
    if (value == null)
        node.removeAttribute(attribute);
    else
        node.setAttribute(attribute, value);
}
function children(element) {
    return Array.from(element.childNodes);
}
function set_data(text, data) {
    data = '' + data;
    if (text.data !== data)
        text.data = data;
}
function set_style(node, key, value) {
    node.style.setProperty(key, value);
}
function custom_event(type, detail) {
    const e = document.createEvent('CustomEvent');
    e.initCustomEvent(type, false, false, detail);
    return e;
}

let stylesheet;
let active = 0;
let current_rules = {};
// https://github.com/darkskyapp/string-hash/blob/master/index.js
function hash(str) {
    let hash = 5381;
    let i = str.length;
    while (i--)
        hash = ((hash << 5) - hash) ^ str.charCodeAt(i);
    return hash >>> 0;
}
function create_rule(node, a, b, duration, delay, ease, fn, uid = 0) {
    const step = 16.666 / duration;
    let keyframes = '{\n';
    for (let p = 0; p <= 1; p += step) {
        const t = a + (b - a) * ease(p);
        keyframes += p * 100 + `%{${fn(t, 1 - t)}}\n`;
    }
    const rule = keyframes + `100% {${fn(b, 1 - b)}}\n}`;
    const name = `__svelte_${hash(rule)}_${uid}`;
    if (!current_rules[name]) {
        if (!stylesheet) {
            const style = element('style');
            document.head.appendChild(style);
            stylesheet = style.sheet;
        }
        current_rules[name] = true;
        stylesheet.insertRule(`@keyframes ${name} ${rule}`, stylesheet.cssRules.length);
    }
    const animation = node.style.animation || '';
    node.style.animation = `${animation ? `${animation}, ` : ``}${name} ${duration}ms linear ${delay}ms 1 both`;
    active += 1;
    return name;
}
function delete_rule(node, name) {
    node.style.animation = (node.style.animation || '')
        .split(', ')
        .filter(name
        ? anim => anim.indexOf(name) < 0 // remove specific animation
        : anim => anim.indexOf('__svelte') === -1 // remove all Svelte animations
    )
        .join(', ');
    if (name && !--active)
        clear_rules();
}
function clear_rules() {
    raf(() => {
        if (active)
            return;
        let i = stylesheet.cssRules.length;
        while (i--)
            stylesheet.deleteRule(i);
        current_rules = {};
    });
}

function create_animation(node, from, fn, params) {
    if (!from)
        return noop;
    const to = node.getBoundingClientRect();
    if (from.left === to.left && from.right === to.right && from.top === to.top && from.bottom === to.bottom)
        return noop;
    const { delay = 0, duration = 300, easing = identity, 
    // @ts-ignore todo: should this be separated from destructuring? Or start/end added to public api and documentation?
    start: start_time = now() + delay, 
    // @ts-ignore todo:
    end = start_time + duration, tick = noop, css } = fn(node, { from, to }, params);
    let running = true;
    let started = false;
    let name;
    function start() {
        if (css) {
            name = create_rule(node, 0, 1, duration, delay, easing, css);
        }
        if (!delay) {
            started = true;
        }
    }
    function stop() {
        if (css)
            delete_rule(node, name);
        running = false;
    }
    loop(now$$1 => {
        if (!started && now$$1 >= start_time) {
            started = true;
        }
        if (started && now$$1 >= end) {
            tick(1, 0);
            stop();
        }
        if (!running) {
            return false;
        }
        if (started) {
            const p = now$$1 - start_time;
            const t = 0 + 1 * easing(p / duration);
            tick(t, 1 - t);
        }
        return true;
    });
    start();
    tick(0, 1);
    return stop;
}
function fix_position(node) {
    const style = getComputedStyle(node);
    if (style.position !== 'absolute' && style.position !== 'fixed') {
        const { width, height } = style;
        const a = node.getBoundingClientRect();
        node.style.position = 'absolute';
        node.style.width = width;
        node.style.height = height;
        add_transform(node, a);
    }
}
function add_transform(node, a) {
    const b = node.getBoundingClientRect();
    if (a.left !== b.left || a.top !== b.top) {
        const style = getComputedStyle(node);
        const transform = style.transform === 'none' ? '' : style.transform;
        node.style.transform = `${transform} translate(${a.left - b.left}px, ${a.top - b.top}px)`;
    }
}

let current_component;
function set_current_component(component) {
    current_component = component;
}
function get_current_component() {
    if (!current_component)
        throw new Error(`Function called outside component initialization`);
    return current_component;
}
function onMount(fn) {
    get_current_component().$$.on_mount.push(fn);
}
function createEventDispatcher() {
    const component = current_component;
    return (type, detail) => {
        const callbacks = component.$$.callbacks[type];
        if (callbacks) {
            // TODO are there situations where events could be dispatched
            // in a server (non-DOM) environment?
            const event = custom_event(type, detail);
            callbacks.slice().forEach(fn => {
                fn.call(component, event);
            });
        }
    };
}

const dirty_components = [];
const resolved_promise = Promise.resolve();
let update_scheduled = false;
const binding_callbacks = [];
const render_callbacks = [];
const flush_callbacks = [];
function schedule_update() {
    if (!update_scheduled) {
        update_scheduled = true;
        resolved_promise.then(flush);
    }
}
function add_render_callback(fn) {
    render_callbacks.push(fn);
}
function flush() {
    const seen_callbacks = new Set();
    do {
        // first, call beforeUpdate functions
        // and update components
        while (dirty_components.length) {
            const component = dirty_components.shift();
            set_current_component(component);
            update(component.$$);
        }
        while (binding_callbacks.length)
            binding_callbacks.shift()();
        // then, once components are updated, call
        // afterUpdate functions. This may cause
        // subsequent updates...
        while (render_callbacks.length) {
            const callback = render_callbacks.pop();
            if (!seen_callbacks.has(callback)) {
                callback();
                // ...so guard against infinite loops
                seen_callbacks.add(callback);
            }
        }
    } while (dirty_components.length);
    while (flush_callbacks.length) {
        flush_callbacks.pop()();
    }
    update_scheduled = false;
}
function update($$) {
    if ($$.fragment) {
        $$.update($$.dirty);
        run_all($$.before_render);
        $$.fragment.p($$.dirty, $$.ctx);
        $$.dirty = null;
        $$.after_render.forEach(add_render_callback);
    }
}

let promise;
function wait() {
    if (!promise) {
        promise = Promise.resolve();
        promise.then(() => {
            promise = null;
        });
    }
    return promise;
}
function dispatch(node, direction, kind) {
    node.dispatchEvent(custom_event(`${direction ? 'intro' : 'outro'}${kind}`));
}
let outros;
function group_outros() {
    outros = {
        remaining: 0,
        callbacks: []
    };
}
function check_outros() {
    if (!outros.remaining) {
        run_all(outros.callbacks);
    }
}
function on_outro(callback) {
    outros.callbacks.push(callback);
}
function create_in_transition(node, fn, params) {
    let config = fn(node, params);
    let running = false;
    let animation_name;
    let task;
    let uid = 0;
    function cleanup() {
        if (animation_name)
            delete_rule(node, animation_name);
    }
    function go() {
        const { delay = 0, duration = 300, easing = identity, tick: tick$$1 = noop, css } = config;
        if (css)
            animation_name = create_rule(node, 0, 1, duration, delay, easing, css, uid++);
        tick$$1(0, 1);
        const start_time = now() + delay;
        const end_time = start_time + duration;
        if (task)
            task.abort();
        running = true;
        add_render_callback(() => dispatch(node, true, 'start'));
        task = loop(now$$1 => {
            if (running) {
                if (now$$1 >= end_time) {
                    tick$$1(1, 0);
                    dispatch(node, true, 'end');
                    cleanup();
                    return running = false;
                }
                if (now$$1 >= start_time) {
                    const t = easing((now$$1 - start_time) / duration);
                    tick$$1(t, 1 - t);
                }
            }
            return running;
        });
    }
    let started = false;
    return {
        start() {
            if (started)
                return;
            delete_rule(node);
            if (is_function(config)) {
                config = config();
                wait().then(go);
            }
            else {
                go();
            }
        },
        invalidate() {
            started = false;
        },
        end() {
            if (running) {
                cleanup();
                running = false;
            }
        }
    };
}
function create_bidirectional_transition(node, fn, params, intro) {
    let config = fn(node, params);
    let t = intro ? 0 : 1;
    let running_program = null;
    let pending_program = null;
    let animation_name = null;
    function clear_animation() {
        if (animation_name)
            delete_rule(node, animation_name);
    }
    function init(program, duration) {
        const d = program.b - t;
        duration *= Math.abs(d);
        return {
            a: t,
            b: program.b,
            d,
            duration,
            start: program.start,
            end: program.start + duration,
            group: program.group
        };
    }
    function go(b) {
        const { delay = 0, duration = 300, easing = identity, tick: tick$$1 = noop, css } = config;
        const program = {
            start: now() + delay,
            b
        };
        if (!b) {
            // @ts-ignore todo: improve typings
            program.group = outros;
            outros.remaining += 1;
        }
        if (running_program) {
            pending_program = program;
        }
        else {
            // if this is an intro, and there's a delay, we need to do
            // an initial tick and/or apply CSS animation immediately
            if (css) {
                clear_animation();
                animation_name = create_rule(node, t, b, duration, delay, easing, css);
            }
            if (b)
                tick$$1(0, 1);
            running_program = init(program, duration);
            add_render_callback(() => dispatch(node, b, 'start'));
            loop(now$$1 => {
                if (pending_program && now$$1 > pending_program.start) {
                    running_program = init(pending_program, duration);
                    pending_program = null;
                    dispatch(node, running_program.b, 'start');
                    if (css) {
                        clear_animation();
                        animation_name = create_rule(node, t, running_program.b, running_program.duration, 0, easing, config.css);
                    }
                }
                if (running_program) {
                    if (now$$1 >= running_program.end) {
                        tick$$1(t = running_program.b, 1 - t);
                        dispatch(node, running_program.b, 'end');
                        if (!pending_program) {
                            // we're done
                            if (running_program.b) {
                                // intro — we can tidy up immediately
                                clear_animation();
                            }
                            else {
                                // outro — needs to be coordinated
                                if (!--running_program.group.remaining)
                                    run_all(running_program.group.callbacks);
                            }
                        }
                        running_program = null;
                    }
                    else if (now$$1 >= running_program.start) {
                        const p = now$$1 - running_program.start;
                        t = running_program.a + running_program.d * easing(p / running_program.duration);
                        tick$$1(t, 1 - t);
                    }
                }
                return !!(running_program || pending_program);
            });
        }
    }
    return {
        run(b) {
            if (is_function(config)) {
                wait().then(() => {
                    // @ts-ignore
                    config = config();
                    go(b);
                });
            }
            else {
                go(b);
            }
        },
        end() {
            clear_animation();
            running_program = pending_program = null;
        }
    };
}

function handle_promise(promise, info) {
    const token = info.token = {};
    function update(type, index, key, value) {
        if (info.token !== token)
            return;
        info.resolved = key && { [key]: value };
        const child_ctx = assign(assign({}, info.ctx), info.resolved);
        const block = type && (info.current = type)(child_ctx);
        if (info.block) {
            if (info.blocks) {
                info.blocks.forEach((block, i) => {
                    if (i !== index && block) {
                        group_outros();
                        on_outro(() => {
                            block.d(1);
                            info.blocks[i] = null;
                        });
                        block.o(1);
                        check_outros();
                    }
                });
            }
            else {
                info.block.d(1);
            }
            block.c();
            if (block.i)
                block.i(1);
            block.m(info.mount(), info.anchor);
            flush();
        }
        info.block = block;
        if (info.blocks)
            info.blocks[index] = block;
    }
    if (is_promise(promise)) {
        promise.then(value => {
            update(info.then, 1, info.value, value);
        }, error => {
            update(info.catch, 2, info.error, error);
        });
        // if we previously had a then/catch block, destroy it
        if (info.current !== info.pending) {
            update(info.pending, 0);
            return true;
        }
    }
    else {
        if (info.current !== info.then) {
            update(info.then, 1, info.value, promise);
            return true;
        }
        info.resolved = { [info.value]: promise };
    }
}

function destroy_block(block, lookup) {
    block.d(1);
    lookup.delete(block.key);
}
function outro_and_destroy_block(block, lookup) {
    on_outro(() => {
        destroy_block(block, lookup);
    });
    block.o(1);
}
function fix_and_outro_and_destroy_block(block, lookup) {
    block.f();
    outro_and_destroy_block(block, lookup);
}
function update_keyed_each(old_blocks, changed, get_key, dynamic, ctx, list, lookup, node, destroy, create_each_block, next, get_context) {
    let o = old_blocks.length;
    let n = list.length;
    let i = o;
    const old_indexes = {};
    while (i--)
        old_indexes[old_blocks[i].key] = i;
    const new_blocks = [];
    const new_lookup = new Map();
    const deltas = new Map();
    i = n;
    while (i--) {
        const child_ctx = get_context(ctx, list, i);
        const key = get_key(child_ctx);
        let block = lookup.get(key);
        if (!block) {
            block = create_each_block(key, child_ctx);
            block.c();
        }
        else if (dynamic) {
            block.p(changed, child_ctx);
        }
        new_lookup.set(key, new_blocks[i] = block);
        if (key in old_indexes)
            deltas.set(key, Math.abs(i - old_indexes[key]));
    }
    const will_move = new Set();
    const did_move = new Set();
    function insert(block) {
        if (block.i)
            block.i(1);
        block.m(node, next);
        lookup.set(block.key, block);
        next = block.first;
        n--;
    }
    while (o && n) {
        const new_block = new_blocks[n - 1];
        const old_block = old_blocks[o - 1];
        const new_key = new_block.key;
        const old_key = old_block.key;
        if (new_block === old_block) {
            // do nothing
            next = new_block.first;
            o--;
            n--;
        }
        else if (!new_lookup.has(old_key)) {
            // remove old block
            destroy(old_block, lookup);
            o--;
        }
        else if (!lookup.has(new_key) || will_move.has(new_key)) {
            insert(new_block);
        }
        else if (did_move.has(old_key)) {
            o--;
        }
        else if (deltas.get(new_key) > deltas.get(old_key)) {
            did_move.add(new_key);
            insert(new_block);
        }
        else {
            will_move.add(old_key);
            o--;
        }
    }
    while (o--) {
        const old_block = old_blocks[o];
        if (!new_lookup.has(old_block.key))
            destroy(old_block, lookup);
    }
    while (n)
        insert(new_blocks[n - 1]);
    return new_blocks;
}

function get_spread_update(levels, updates) {
    const update = {};
    const to_null_out = {};
    const accounted_for = { $$scope: 1 };
    let i = levels.length;
    while (i--) {
        const o = levels[i];
        const n = updates[i];
        if (n) {
            for (const key in o) {
                if (!(key in n))
                    to_null_out[key] = 1;
            }
            for (const key in n) {
                if (!accounted_for[key]) {
                    update[key] = n[key];
                    accounted_for[key] = 1;
                }
            }
            levels[i] = n;
        }
        else {
            for (const key in o) {
                accounted_for[key] = 1;
            }
        }
    }
    for (const key in to_null_out) {
        if (!(key in update))
            update[key] = undefined;
    }
    return update;
}
function mount_component(component, target, anchor) {
    const { fragment, on_mount, on_destroy, after_render } = component.$$;
    fragment.m(target, anchor);
    // onMount happens after the initial afterUpdate. Because
    // afterUpdate callbacks happen in reverse order (inner first)
    // we schedule onMount callbacks before afterUpdate callbacks
    add_render_callback(() => {
        const new_on_destroy = on_mount.map(run).filter(is_function);
        if (on_destroy) {
            on_destroy.push(...new_on_destroy);
        }
        else {
            // Edge case - component was destroyed immediately,
            // most likely as a result of a binding initialising
            run_all(new_on_destroy);
        }
        component.$$.on_mount = [];
    });
    after_render.forEach(add_render_callback);
}
function destroy(component, detaching) {
    if (component.$$) {
        run_all(component.$$.on_destroy);
        component.$$.fragment.d(detaching);
        // TODO null out other refs, including component.$$ (but need to
        // preserve final state?)
        component.$$.on_destroy = component.$$.fragment = null;
        component.$$.ctx = {};
    }
}
function make_dirty(component, key) {
    if (!component.$$.dirty) {
        dirty_components.push(component);
        schedule_update();
        component.$$.dirty = blank_object();
    }
    component.$$.dirty[key] = true;
}
function init(component, options, instance, create_fragment, not_equal$$1, prop_names) {
    const parent_component = current_component;
    set_current_component(component);
    const props = options.props || {};
    const $$ = component.$$ = {
        fragment: null,
        ctx: null,
        // state
        props: prop_names,
        update: noop,
        not_equal: not_equal$$1,
        bound: blank_object(),
        // lifecycle
        on_mount: [],
        on_destroy: [],
        before_render: [],
        after_render: [],
        context: new Map(parent_component ? parent_component.$$.context : []),
        // everything else
        callbacks: blank_object(),
        dirty: null
    };
    let ready = false;
    $$.ctx = instance
        ? instance(component, props, (key, value) => {
            if ($$.ctx && not_equal$$1($$.ctx[key], $$.ctx[key] = value)) {
                if ($$.bound[key])
                    $$.bound[key](value);
                if (ready)
                    make_dirty(component, key);
            }
        })
        : props;
    $$.update();
    ready = true;
    run_all($$.before_render);
    $$.fragment = create_fragment($$.ctx);
    if (options.target) {
        if (options.hydrate) {
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            $$.fragment.l(children(options.target));
        }
        else {
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            $$.fragment.c();
        }
        if (options.intro && component.$$.fragment.i)
            component.$$.fragment.i();
        mount_component(component, options.target, options.anchor);
        flush();
    }
    set_current_component(parent_component);
}
class SvelteComponent {
    $destroy() {
        destroy(this, true);
        this.$destroy = noop;
    }
    $on(type, callback) {
        const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
        callbacks.push(callback);
        return () => {
            const index = callbacks.indexOf(callback);
            if (index !== -1)
                callbacks.splice(index, 1);
        };
    }
    $set() {
        // overridden by instance, if it has props
    }
}
class SvelteComponentDev extends SvelteComponent {
    constructor(options) {
        if (!options || (!options.target && !options.$$inline)) {
            throw new Error(`'target' is a required option`);
        }
        super();
    }
    $destroy() {
        super.$destroy();
        this.$destroy = () => {
            console.warn(`Component was already destroyed`); // eslint-disable-line no-console
        };
    }
}

/* src\components\Tab.svelte generated by Svelte v3.5.1 */

const file = "src\\components\\Tab.svelte";

// (28:0) {:else}
function create_else_block(ctx) {
	var div, t, dispose;

	return {
		c: function create() {
			div = element("div");
			t = text(ctx.title);
			div.className = "svelte-1av4as1";
			add_location(div, file, 28, 2, 541);
			dispose = listen(div, "click", ctx.toggleEdit);
		},

		m: function mount(target, anchor) {
			insert(target, div, anchor);
			append(div, t);
		},

		p: function update_1(changed, ctx) {
			if (changed.title) {
				set_data(t, ctx.title);
			}
		},

		d: function destroy(detaching) {
			if (detaching) {
				detach(div);
			}

			dispose();
		}
	};
}

// (26:0) {#if toggle}
function create_if_block(ctx) {
	var input, dispose;

	return {
		c: function create() {
			input = element("input");
			attr(input, "type", "text");
			input.autofocus = true;
			add_location(input, file, 26, 2, 461);

			dispose = [
				listen(input, "input", ctx.input_input_handler),
				listen(input, "blur", ctx.update)
			];
		},

		m: function mount(target, anchor) {
			insert(target, input, anchor);

			input.value = ctx.title;

			input.focus();
		},

		p: function update_1(changed, ctx) {
			if (changed.title && (input.value !== ctx.title)) input.value = ctx.title;
		},

		d: function destroy(detaching) {
			if (detaching) {
				detach(input);
			}

			run_all(dispose);
		}
	};
}

function create_fragment(ctx) {
	var if_block_anchor;

	function select_block_type(ctx) {
		if (ctx.toggle) return create_if_block;
		return create_else_block;
	}

	var current_block_type = select_block_type(ctx);
	var if_block = current_block_type(ctx);

	return {
		c: function create() {
			if_block.c();
			if_block_anchor = empty();
		},

		l: function claim(nodes) {
			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
		},

		m: function mount(target, anchor) {
			if_block.m(target, anchor);
			insert(target, if_block_anchor, anchor);
		},

		p: function update_1(changed, ctx) {
			if (current_block_type === (current_block_type = select_block_type(ctx)) && if_block) {
				if_block.p(changed, ctx);
			} else {
				if_block.d(1);
				if_block = current_block_type(ctx);
				if (if_block) {
					if_block.c();
					if_block.m(if_block_anchor.parentNode, if_block_anchor);
				}
			}
		},

		i: noop,
		o: noop,

		d: function destroy(detaching) {
			if_block.d(detaching);

			if (detaching) {
				detach(if_block_anchor);
			}
		}
	};
}

function instance($$self, $$props, $$invalidate) {
	let { title = "" } = $$props;
  let toggle = false;
  function toggleEdit() {
    $$invalidate('toggle', toggle = !toggle);
  }

  const dispatch = createEventDispatcher();
  function update() {
    // console.log("blur");
    toggleEdit();
    dispatch("notify", title);
  }

	const writable_props = ['title'];
	Object.keys($$props).forEach(key => {
		if (!writable_props.includes(key) && !key.startsWith('$$')) console.warn(`<Tab> was created with unknown prop '${key}'`);
	});

	function input_input_handler() {
		title = this.value;
		$$invalidate('title', title);
	}

	$$self.$set = $$props => {
		if ('title' in $$props) $$invalidate('title', title = $$props.title);
	};

	return {
		title,
		toggle,
		toggleEdit,
		update,
		input_input_handler
	};
}

class Tab extends SvelteComponentDev {
	constructor(options) {
		super(options);
		init(this, options, instance, create_fragment, safe_not_equal, ["title"]);
	}

	get title() {
		throw new Error("<Tab>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set title(value) {
		throw new Error("<Tab>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}
}

function cubicOut(t) {
    const f = t - 1.0;
    return f * f * f + 1.0;
}

function fade(node, { delay = 0, duration = 400 }) {
    const o = +getComputedStyle(node).opacity;
    return {
        delay,
        duration,
        css: t => `opacity: ${t * o}`
    };
}
function fly(node, { delay = 0, duration = 400, easing = cubicOut, x = 0, y = 0, opacity = 0 }) {
    const style = getComputedStyle(node);
    const target_opacity = +style.opacity;
    const transform = style.transform === 'none' ? '' : style.transform;
    const od = target_opacity * (1 - opacity);
    return {
        delay,
        duration,
        easing,
        css: (t, u) => `
			transform: ${transform} translate(${(1 - t) * x}px, ${(1 - t) * y}px);
			opacity: ${target_opacity - (od * u)}`
    };
}

/**
 * Create a `Writable` store that allows both updating and reading by subscription.
 * @param {*=}value initial value
 * @param {StartStopNotifier=}start start and stop notifications for subscriptions
 */
function writable(value, start = noop) {
    let stop;
    const subscribers = [];
    function set(new_value) {
        if (safe_not_equal(value, new_value)) {
            value = new_value;
            if (!stop) {
                return; // not ready
            }
            subscribers.forEach((s) => s[1]());
            subscribers.forEach((s) => s[0](value));
        }
    }
    function update(fn) {
        set(fn(value));
    }
    function subscribe(run, invalidate = noop) {
        const subscriber = [run, invalidate];
        subscribers.push(subscriber);
        if (subscribers.length === 1) {
            stop = start(set) || noop;
        }
        run(value);
        return () => {
            const index = subscribers.indexOf(subscriber);
            if (index !== -1) {
                subscribers.splice(index, 1);
            }
            if (subscribers.length === 0) {
                stop();
            }
        };
    }
    return { set, update, subscribe };
}

const activeUITab = writable(0);
const studyStore = writable([]);
const variableStore = writable([]);

/* src\components\Tabs.svelte generated by Svelte v3.5.1 */

const file$1 = "src\\components\\Tabs.svelte";

function get_each_context(ctx, list, i) {
	const child_ctx = Object.create(ctx);
	child_ctx.title = list[i];
	child_ctx.i = i;
	return child_ctx;
}

// (79:4) {:else}
function create_else_block_1(ctx) {
	var li, current;

	var tabitem = new Tab({
		props: { title: ctx.title },
		$$inline: true
	});
	tabitem.$on("notify", ctx.titleChanged);

	return {
		c: function create() {
			li = element("li");
			tabitem.$$.fragment.c();
			li.className = "active svelte-tibrtl";
			add_location(li, file$1, 79, 6, 1638);
		},

		m: function mount(target, anchor) {
			insert(target, li, anchor);
			mount_component(tabitem, li, null);
			current = true;
		},

		p: function update(changed, ctx) {
			var tabitem_changes = {};
			if (changed.currentTabs) tabitem_changes.title = ctx.title;
			tabitem.$set(tabitem_changes);
		},

		i: function intro(local) {
			if (current) return;
			tabitem.$$.fragment.i(local);

			current = true;
		},

		o: function outro(local) {
			tabitem.$$.fragment.o(local);
			current = false;
		},

		d: function destroy(detaching) {
			if (detaching) {
				detach(li);
			}

			tabitem.$destroy();
		}
	};
}

// (75:4) {#if i !== activeTab}
function create_if_block_1(ctx) {
	var li, current, dispose;

	var tabitem = new Tab({
		props: { title: ctx.title },
		$$inline: true
	});

	function click_handler() {
		return ctx.click_handler(ctx);
	}

	return {
		c: function create() {
			li = element("li");
			tabitem.$$.fragment.c();
			li.className = "svelte-tibrtl";
			add_location(li, file$1, 75, 6, 1542);
			dispose = listen(li, "click", click_handler);
		},

		m: function mount(target, anchor) {
			insert(target, li, anchor);
			mount_component(tabitem, li, null);
			current = true;
		},

		p: function update(changed, new_ctx) {
			ctx = new_ctx;
			var tabitem_changes = {};
			if (changed.currentTabs) tabitem_changes.title = ctx.title;
			tabitem.$set(tabitem_changes);
		},

		i: function intro(local) {
			if (current) return;
			tabitem.$$.fragment.i(local);

			current = true;
		},

		o: function outro(local) {
			tabitem.$$.fragment.o(local);
			current = false;
		},

		d: function destroy(detaching) {
			if (detaching) {
				detach(li);
			}

			tabitem.$destroy();

			dispose();
		}
	};
}

// (74:2) {#each currentTabs as title, i}
function create_each_block(ctx) {
	var current_block_type_index, if_block, if_block_anchor, current;

	var if_block_creators = [
		create_if_block_1,
		create_else_block_1
	];

	var if_blocks = [];

	function select_block_type(ctx) {
		if (ctx.i !== ctx.activeTab) return 0;
		return 1;
	}

	current_block_type_index = select_block_type(ctx);
	if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);

	return {
		c: function create() {
			if_block.c();
			if_block_anchor = empty();
		},

		m: function mount(target, anchor) {
			if_blocks[current_block_type_index].m(target, anchor);
			insert(target, if_block_anchor, anchor);
			current = true;
		},

		p: function update(changed, ctx) {
			var previous_block_index = current_block_type_index;
			current_block_type_index = select_block_type(ctx);
			if (current_block_type_index === previous_block_index) {
				if_blocks[current_block_type_index].p(changed, ctx);
			} else {
				group_outros();
				on_outro(() => {
					if_blocks[previous_block_index].d(1);
					if_blocks[previous_block_index] = null;
				});
				if_block.o(1);
				check_outros();

				if_block = if_blocks[current_block_type_index];
				if (!if_block) {
					if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
					if_block.c();
				}
				if_block.i(1);
				if_block.m(if_block_anchor.parentNode, if_block_anchor);
			}
		},

		i: function intro(local) {
			if (current) return;
			if (if_block) if_block.i();
			current = true;
		},

		o: function outro(local) {
			if (if_block) if_block.o();
			current = false;
		},

		d: function destroy(detaching) {
			if_blocks[current_block_type_index].d(detaching);

			if (detaching) {
				detach(if_block_anchor);
			}
		}
	};
}

// (94:4) {:else}
function create_else_block$1(ctx) {
	var div, dispose;

	return {
		c: function create() {
			div = element("div");
			div.textContent = "+";
			div.className = "svelte-tibrtl";
			add_location(div, file$1, 94, 6, 2003);
			dispose = listen(div, "click", ctx.toggle);
		},

		m: function mount(target, anchor) {
			insert(target, div, anchor);
		},

		p: noop,
		i: noop,
		o: noop,

		d: function destroy(detaching) {
			if (detaching) {
				detach(div);
			}

			dispose();
		}
	};
}

// (86:4) {#if toggleTab}
function create_if_block$1(ctx) {
	var input, input_intro, dispose;

	return {
		c: function create() {
			input = element("input");
			input.id = "newTab";
			attr(input, "type", "text");
			input.autofocus = true;
			add_location(input, file$1, 86, 6, 1783);

			dispose = [
				listen(input, "blur", ctx.addTab),
				listen(input, "keydown", ctx.keydown_handler)
			];
		},

		m: function mount(target, anchor) {
			insert(target, input, anchor);
			input.focus();
		},

		p: noop,

		i: function intro(local) {
			if (!input_intro) {
				add_render_callback(() => {
					input_intro = create_in_transition(input, fade, { duration: 100 });
					input_intro.start();
				});
			}
		},

		o: noop,

		d: function destroy(detaching) {
			if (detaching) {
				detach(input);
			}

			run_all(dispose);
		}
	};
}

function create_fragment$1(ctx) {
	var ul, t, li, current;

	var each_value = ctx.currentTabs;

	var each_blocks = [];

	for (var i = 0; i < each_value.length; i += 1) {
		each_blocks[i] = create_each_block(get_each_context(ctx, each_value, i));
	}

	function outro_block(i, detaching, local) {
		if (each_blocks[i]) {
			if (detaching) {
				on_outro(() => {
					each_blocks[i].d(detaching);
					each_blocks[i] = null;
				});
			}

			each_blocks[i].o(local);
		}
	}

	function select_block_type_1(ctx) {
		if (ctx.toggleTab) return create_if_block$1;
		return create_else_block$1;
	}

	var current_block_type = select_block_type_1(ctx);
	var if_block = current_block_type(ctx);

	return {
		c: function create() {
			ul = element("ul");

			for (var i = 0; i < each_blocks.length; i += 1) {
				each_blocks[i].c();
			}

			t = space();
			li = element("li");
			if_block.c();
			li.className = "svelte-tibrtl";
			add_location(li, file$1, 84, 2, 1750);
			ul.className = "svelte-tibrtl";
			add_location(ul, file$1, 72, 0, 1468);
		},

		l: function claim(nodes) {
			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
		},

		m: function mount(target, anchor) {
			insert(target, ul, anchor);

			for (var i = 0; i < each_blocks.length; i += 1) {
				each_blocks[i].m(ul, null);
			}

			append(ul, t);
			append(ul, li);
			if_block.m(li, null);
			current = true;
		},

		p: function update(changed, ctx) {
			if (changed.activeTab || changed.currentTabs || changed.titleChanged) {
				each_value = ctx.currentTabs;

				for (var i = 0; i < each_value.length; i += 1) {
					const child_ctx = get_each_context(ctx, each_value, i);

					if (each_blocks[i]) {
						each_blocks[i].p(changed, child_ctx);
						each_blocks[i].i(1);
					} else {
						each_blocks[i] = create_each_block(child_ctx);
						each_blocks[i].c();
						each_blocks[i].i(1);
						each_blocks[i].m(ul, t);
					}
				}

				group_outros();
				for (; i < each_blocks.length; i += 1) outro_block(i, 1, 1);
				check_outros();
			}

			if (current_block_type === (current_block_type = select_block_type_1(ctx)) && if_block) {
				if_block.p(changed, ctx);
			} else {
				if_block.d(1);
				if_block = current_block_type(ctx);
				if (if_block) {
					if_block.c();
					if_block.i(1);
					if_block.m(li, null);
				}
			}
		},

		i: function intro(local) {
			if (current) return;
			for (var i = 0; i < each_value.length; i += 1) each_blocks[i].i();

			if (if_block) if_block.i();
			current = true;
		},

		o: function outro(local) {
			each_blocks = each_blocks.filter(Boolean);
			for (let i = 0; i < each_blocks.length; i += 1) outro_block(i, 0, 0);

			current = false;
		},

		d: function destroy(detaching) {
			if (detaching) {
				detach(ul);
			}

			destroy_each(each_blocks, detaching);

			if_block.d();
		}
	};
}

function instance$1($$self, $$props, $$invalidate) {
	

  let currentTabs = [
    "Studies",
    "Overview Study 1",
    "User View Study 1",
    "Descriptive Stats Study 1"
  ];
  let activeTab = 0;

  function activate(tab) {
    $$invalidate('activeTab', activeTab = tab);
    activeUITab.set(tab);
  }

  let toggleTab = false;
  function toggle() {
    $$invalidate('toggleTab', toggleTab = !toggleTab);
  }

  function addTab() {
    const el = document.getElementById("newTab");
    const text = el.value.trim();
    if (text !== "") {
      currentTabs.push(el.value);
      $$invalidate('currentTabs', currentTabs);
      $$invalidate('activeTab', activeTab = currentTabs.length - 1);
    }
    toggle();
  }

  function titleChanged(event) {
    console.log("titlechanged");
    currentTabs[activeTab] = event.detail; $$invalidate('currentTabs', currentTabs);
  }

	function click_handler({ i }) {
		return activate(i);
	}

	function keydown_handler(e) {
		return (e.code === 'Enter' ? addTab() : null);
	}

	return {
		currentTabs,
		activeTab,
		activate,
		toggleTab,
		toggle,
		addTab,
		titleChanged,
		click_handler,
		keydown_handler
	};
}

class Tabs extends SvelteComponentDev {
	constructor(options) {
		super(options);
		init(this, options, instance$1, create_fragment$1, safe_not_equal, []);
	}
}

/* src\components\StudyInfo.svelte generated by Svelte v3.5.1 */

const file$2 = "src\\components\\StudyInfo.svelte";

// (31:0) {:else}
function create_else_block$2(ctx) {
	var div;

	return {
		c: function create() {
			div = element("div");
			div.textContent = "SensQVis";
			div.className = "appTitle svelte-9957gg";
			add_location(div, file$2, 31, 2, 674);
		},

		m: function mount(target, anchor) {
			insert(target, div, anchor);
		},

		p: noop,

		d: function destroy(detaching) {
			if (detaching) {
				detach(div);
			}
		}
	};
}

// (24:0) {#if $activeUITab != 0}
function create_if_block$2(ctx) {
	var div4, div0, t0, t1, t2, div1, t3, t4, t5, div2, t6, t7, t8, div3, t9, t10;

	return {
		c: function create() {
			div4 = element("div");
			div0 = element("div");
			t0 = text("Study name: ");
			t1 = text(name);
			t2 = space();
			div1 = element("div");
			t3 = text("Total study time elapsed: ");
			t4 = text(time);
			t5 = space();
			div2 = element("div");
			t6 = text("Number of active participants: ");
			t7 = text(participants);
			t8 = space();
			div3 = element("div");
			t9 = text("Datasets collected: ");
			t10 = text(datasets);
			add_location(div0, file$2, 25, 4, 464);
			add_location(div1, file$2, 26, 4, 499);
			add_location(div2, file$2, 27, 4, 548);
			add_location(div3, file$2, 28, 4, 610);
			div4.id = "info";
			div4.className = "svelte-9957gg";
			add_location(div4, file$2, 24, 2, 443);
		},

		m: function mount(target, anchor) {
			insert(target, div4, anchor);
			append(div4, div0);
			append(div0, t0);
			append(div0, t1);
			append(div4, t2);
			append(div4, div1);
			append(div1, t3);
			append(div1, t4);
			append(div4, t5);
			append(div4, div2);
			append(div2, t6);
			append(div2, t7);
			append(div4, t8);
			append(div4, div3);
			append(div3, t9);
			append(div3, t10);
		},

		p: noop,

		d: function destroy(detaching) {
			if (detaching) {
				detach(div4);
			}
		}
	};
}

function create_fragment$2(ctx) {
	var if_block_anchor;

	function select_block_type(ctx) {
		if (ctx.$activeUITab != 0) return create_if_block$2;
		return create_else_block$2;
	}

	var current_block_type = select_block_type(ctx);
	var if_block = current_block_type(ctx);

	return {
		c: function create() {
			if_block.c();
			if_block_anchor = empty();
		},

		l: function claim(nodes) {
			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
		},

		m: function mount(target, anchor) {
			if_block.m(target, anchor);
			insert(target, if_block_anchor, anchor);
		},

		p: function update(changed, ctx) {
			if (current_block_type === (current_block_type = select_block_type(ctx)) && if_block) {
				if_block.p(changed, ctx);
			} else {
				if_block.d(1);
				if_block = current_block_type(ctx);
				if (if_block) {
					if_block.c();
					if_block.m(if_block_anchor.parentNode, if_block_anchor);
				}
			}
		},

		i: noop,
		o: noop,

		d: function destroy(detaching) {
			if_block.d(detaching);

			if (detaching) {
				detach(if_block_anchor);
			}
		}
	};
}

let name = "Test Study";

let time = "78%";

let participants = 27;

let datasets = 1326;

function instance$2($$self, $$props, $$invalidate) {
	let $activeUITab;

	validate_store(activeUITab, 'activeUITab');
	subscribe($$self, activeUITab, $$value => { $activeUITab = $$value; $$invalidate('$activeUITab', $activeUITab); });

	return { $activeUITab };
}

class StudyInfo extends SvelteComponentDev {
	constructor(options) {
		super(options);
		init(this, options, instance$2, create_fragment$2, safe_not_equal, []);
	}
}

/* src\components\UndoRedo.svelte generated by Svelte v3.5.1 */

const file$3 = "src\\components\\UndoRedo.svelte";

function create_fragment$3(ctx) {
	var div, svg0, path0, t0, label0, t2, svg1, path1, t3, label1;

	return {
		c: function create() {
			div = element("div");
			svg0 = svg_element("svg");
			path0 = svg_element("path");
			t0 = space();
			label0 = element("label");
			label0.textContent = "undo";
			t2 = space();
			svg1 = svg_element("svg");
			path1 = svg_element("path");
			t3 = space();
			label1 = element("label");
			label1.textContent = "redo";
			attr(path0, "fill", "#333");
			attr(path0, "d", "M12.5,8C9.85,8 7.45,9 5.6,10.6L2,7V16H11L7.38,12.38C8.77,11.22\r\n      10.54,10.5 12.5,10.5C16.04,10.5 19.05,12.81\r\n      20.1,16L22.47,15.22C21.08,11.03 17.15,8 12.5,8Z");
			add_location(path0, file$3, 34, 4, 604);
			attr(svg0, "id", "undo");
			set_style(svg0, "width", "1rem");
			set_style(svg0, "height", "1rem");
			attr(svg0, "viewBox", "0 0 24 24");
			attr(svg0, "class", "svelte-16ia47i");
			add_location(svg0, file$3, 33, 2, 532);
			label0.id = "undoLabel";
			label0.className = "svelte-16ia47i";
			add_location(label0, file$3, 40, 2, 825);
			attr(path1, "fill", "#bbb");
			attr(path1, "d", "M18.4,10.6C16.55,9 14.15,8 11.5,8C6.85,8 2.92,11.03\r\n      1.54,15.22L3.9,16C4.95,12.81 7.95,10.5 11.5,10.5C13.45,10.5 15.23,11.22\r\n      16.62,12.38L13,16H22V7L18.4,10.6Z");
			add_location(path1, file$3, 42, 4, 935);
			attr(svg1, "id", "redo");
			set_style(svg1, "width", "1rem");
			set_style(svg1, "height", "1rem");
			attr(svg1, "viewBox", "0 0 24 24");
			attr(svg1, "class", "svelte-16ia47i");
			add_location(svg1, file$3, 41, 2, 863);
			label1.id = "redoLabel";
			label1.className = "svelte-16ia47i";
			add_location(label1, file$3, 48, 2, 1159);
			div.className = "svelte-16ia47i";
			add_location(div, file$3, 32, 0, 523);
		},

		l: function claim(nodes) {
			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
		},

		m: function mount(target, anchor) {
			insert(target, div, anchor);
			append(div, svg0);
			append(svg0, path0);
			append(div, t0);
			append(div, label0);
			append(div, t2);
			append(div, svg1);
			append(svg1, path1);
			append(div, t3);
			append(div, label1);
		},

		p: noop,
		i: noop,
		o: noop,

		d: function destroy(detaching) {
			if (detaching) {
				detach(div);
			}
		}
	};
}

class UndoRedo extends SvelteComponentDev {
	constructor(options) {
		super(options);
		init(this, options, null, create_fragment$3, safe_not_equal, []);
	}
}

/* src\charts\Anova.svelte generated by Svelte v3.5.1 */

const file$4 = "src\\charts\\Anova.svelte";

function create_fragment$4(ctx) {
	var div;

	return {
		c: function create() {
			div = element("div");
			div.id = "anovaChart";
			div.className = "svelte-1a6ghsc";
			add_location(div, file$4, 163, 0, 3713);
		},

		l: function claim(nodes) {
			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
		},

		m: function mount(target, anchor) {
			insert(target, div, anchor);
		},

		p: noop,
		i: noop,
		o: noop,

		d: function destroy(detaching) {
			if (detaching) {
				detach(div);
			}
		}
	};
}

function instance$3($$self) {
	onMount(() => {
    let anovaChart = echarts.init(document.getElementById("anovaChart"));
    const categoryData = [
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
      "Sunday"
    ];
    const errorData = [];
    const barData = [];
    const dataCount = 7;
    for (var i = 0; i < dataCount; i++) {
      var val = Math.random() * 7;
      //categoryData.push("Day" + (i + 1));
      errorData.push([
        i,
        echarts.number.round(Math.max(0, val - Math.random() * 3)),
        echarts.number.round(val + Math.random() * 3)
      ]);
      barData.push(echarts.number.round(val, 2));
    }

    function renderItem(params, api) {
      var xValue = api.value(0);
      var highPoint = api.coord([xValue, api.value(1)]);
      var lowPoint = api.coord([xValue, api.value(2)]);
      var halfWidth = api.size([1, 0])[0] * 0.05;
      var style = api.style({
        stroke: "#777",
        fill: null
      });

      return {
        type: "group",
        children: [
          {
            type: "line",
            shape: {
              x1: highPoint[0] - halfWidth,
              y1: highPoint[1],
              x2: highPoint[0] + halfWidth,
              y2: highPoint[1]
            },
            style: style
          },
          {
            type: "line",
            shape: {
              x1: highPoint[0],
              y1: highPoint[1],
              x2: lowPoint[0],
              y2: lowPoint[1]
            },
            style: style
          },
          {
            type: "line",
            shape: {
              x1: lowPoint[0] - halfWidth,
              y1: lowPoint[1],
              x2: lowPoint[0] + halfWidth,
              y2: lowPoint[1]
            },
            style: style
          }
        ]
      };
    } // renderItem

    const option = {
      tooltip: {
        trigger: "axis",
        axisPointer: {
          type: "shadow"
        }
      },
      grid: {
        left: 36,
        top: 5,
        right: 0,
        bottom: 25
      },
      // dataZoom: [
      //   {
      //     type: "slider",
      //     start: 1,
      //     end: 40
      //   },
      //   {
      //     type: "inside",
      //     start: 1,
      //     end: 30
      //   }
      // ],
      xAxis: {
        data: categoryData
      },
      yAxis: {
        axisLabel: {
          showMaxLabel: false
        }
      },
      series: [
        {
          type: "bar",
          name: "Availability",
          data: barData,
          itemStyle: {
            normal: {
              color: "#61a0a7"
            }
          }
        },
        {
          type: "custom",
          name: "CI",
          itemStyle: {
            normal: {
              borderWidth: 1.5
            }
          },
          renderItem: renderItem,
          encode: {
            x: 0,
            y: [1, 2]
          },
          data: errorData,
          z: 10
        }
      ]
    };
    anovaChart.setOption(option);

    function resizeChart() {
      if (anovaChart !== null && !anovaChart.isDisposed()) {
        anovaChart.resize();
      }
    }
    window.addEventListener("resize", resizeChart);

    return () => {
      // clean up after component unmounts
      anovaChart.dispose();
      anovaChart = null;
      window.removeEventListener("resize", resizeChart);
    };
  });

	return {};
}

class Anova extends SvelteComponentDev {
	constructor(options) {
		super(options);
		init(this, options, instance$3, create_fragment$4, safe_not_equal, []);
	}
}

/* src\charts\WeekChart.svelte generated by Svelte v3.5.1 */

const file$5 = "src\\charts\\WeekChart.svelte";

function create_fragment$5(ctx) {
	var div;

	return {
		c: function create() {
			div = element("div");
			div.id = "weekChart";
			div.className = "svelte-uu58md";
			add_location(div, file$5, 289, 0, 5577);
		},

		l: function claim(nodes) {
			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
		},

		m: function mount(target, anchor) {
			insert(target, div, anchor);
		},

		p: noop,
		i: noop,
		o: noop,

		d: function destroy(detaching) {
			if (detaching) {
				detach(div);
			}
		}
	};
}

function instance$4($$self) {
	onMount(() => {
    let weekChart = echarts.init(document.getElementById("weekChart"));

    const hours = [
      "0:00",
      "1:00",
      "2:00",
      "3:00",
      "4:00",
      "5:00",
      "6:00",
      "7:00",
      "8:00",
      "9:00",
      "10:00",
      "11:00",
      "12:00",
      "1:00",
      "2:00",
      "3:00",
      "4:00",
      "5:00",
      "6:00",
      "7:00",
      "8:00",
      "9:00",
      "10:00",
      "11:00"
    ];
    const days = [
      "Saturday",
      "Friday",
      "Thursday",
      "Wednesday",
      "Tuesday",
      "Monday",
      "Sunday"
    ];

    const data = [
      [0, 0, 5],
      [0, 1, 1],
      [0, 2, 0],
      [0, 3, 0],
      [0, 4, 0],
      [0, 5, 0],
      [0, 6, 0],
      [0, 7, 0],
      [0, 8, 0],
      [0, 9, 0],
      [0, 10, 0],
      [0, 11, 2],
      [0, 12, 4],
      [0, 13, 1],
      [0, 14, 1],
      [0, 15, 3],
      [0, 16, 4],
      [0, 17, 6],
      [0, 18, 4],
      [0, 19, 4],
      [0, 20, 3],
      [0, 21, 3],
      [0, 22, 2],
      [0, 23, 5],
      [1, 0, 7],
      [1, 1, 0],
      [1, 2, 0],
      [1, 3, 0],
      [1, 4, 0],
      [1, 5, 0],
      [1, 6, 0],
      [1, 7, 0],
      [1, 8, 0],
      [1, 9, 0],
      [1, 10, 5],
      [1, 11, 2],
      [1, 12, 2],
      [1, 13, 6],
      [1, 14, 9],
      [1, 15, 11],
      [1, 16, 6],
      [1, 17, 7],
      [1, 18, 8],
      [1, 19, 12],
      [1, 20, 5],
      [1, 21, 5],
      [1, 22, 7],
      [1, 23, 2],
      [2, 0, 1],
      [2, 1, 1],
      [2, 2, 0],
      [2, 3, 0],
      [2, 4, 0],
      [2, 5, 0],
      [2, 6, 0],
      [2, 7, 0],
      [2, 8, 0],
      [2, 9, 0],
      [2, 10, 3],
      [2, 11, 2],
      [2, 12, 1],
      [2, 13, 9],
      [2, 14, 8],
      [2, 15, 10],
      [2, 16, 6],
      [2, 17, 5],
      [2, 18, 5],
      [2, 19, 5],
      [2, 20, 7],
      [2, 21, 4],
      [2, 22, 2],
      [2, 23, 4],
      [3, 0, 7],
      [3, 1, 3],
      [3, 2, 0],
      [3, 3, 0],
      [3, 4, 0],
      [3, 5, 0],
      [3, 6, 0],
      [3, 7, 0],
      [3, 8, 1],
      [3, 9, 0],
      [3, 10, 5],
      [3, 11, 4],
      [3, 12, 7],
      [3, 13, 14],
      [3, 14, 13],
      [3, 15, 12],
      [3, 16, 9],
      [3, 17, 5],
      [3, 18, 5],
      [3, 19, 10],
      [3, 20, 6],
      [3, 21, 4],
      [3, 22, 4],
      [3, 23, 1],
      [4, 0, 1],
      [4, 1, 3],
      [4, 2, 0],
      [4, 3, 0],
      [4, 4, 0],
      [4, 5, 1],
      [4, 6, 0],
      [4, 7, 0],
      [4, 8, 0],
      [4, 9, 2],
      [4, 10, 4],
      [4, 11, 4],
      [4, 12, 2],
      [4, 13, 4],
      [4, 14, 4],
      [4, 15, 14],
      [4, 16, 12],
      [4, 17, 1],
      [4, 18, 8],
      [4, 19, 5],
      [4, 20, 3],
      [4, 21, 7],
      [4, 22, 3],
      [4, 23, 0],
      [5, 0, 2],
      [5, 1, 1],
      [5, 2, 0],
      [5, 3, 3],
      [5, 4, 0],
      [5, 5, 0],
      [5, 6, 0],
      [5, 7, 0],
      [5, 8, 2],
      [5, 9, 0],
      [5, 10, 4],
      [5, 11, 1],
      [5, 12, 5],
      [5, 13, 10],
      [5, 14, 5],
      [5, 15, 7],
      [5, 16, 11],
      [5, 17, 6],
      [5, 18, 0],
      [5, 19, 5],
      [5, 20, 3],
      [5, 21, 4],
      [5, 22, 2],
      [5, 23, 0],
      [6, 0, 1],
      [6, 1, 0],
      [6, 2, 0],
      [6, 3, 0],
      [6, 4, 0],
      [6, 5, 0],
      [6, 6, 0],
      [6, 7, 0],
      [6, 8, 0],
      [6, 9, 0],
      [6, 10, 1],
      [6, 11, 0],
      [6, 12, 2],
      [6, 13, 1],
      [6, 14, 3],
      [6, 15, 4],
      [6, 16, 0],
      [6, 17, 0],
      [6, 18, 0],
      [6, 19, 0],
      [6, 20, 1],
      [6, 21, 2],
      [6, 22, 2],
      [6, 23, 6]
    ];

    const option = {
      tooltip: {
        position: "top"
      },
      title: [],
      singleAxis: [],
      series: []
    };

    echarts.util.each(days, function(day, idx) {
      option.title.push({
        textBaseline: "middle",
        top: ((idx + 0.5) * 96) / 7 + "%",
        text: day,
        textStyle: {
          color: "#333",
          fontSize: 12,
          fontWeight: 300
        }
      });
      option.singleAxis.push({
        left: 100,
        type: "category",
        boundaryGap: false,
        data: hours,
        top: (idx * 95) / 7 + 5 + "%",
        height: 100 / 7 - 10 + "%",
        axisLabel: {
          interval: 2,
          color: "#333",
          fontSize: 10,
          fontWeight: 300
        }
      });
      option.series.push({
        singleAxisIndex: idx,
        coordinateSystem: "singleAxis",
        type: "scatter",
        data: [],
        symbolSize: function(dataItem) {
          return dataItem[1] * 2;
        }
      });
    });

    echarts.util.each(data, function(dataItem) {
      option.series[dataItem[0]].data.push([dataItem[1], dataItem[2]]);
    });

    weekChart.setOption(option);

    function resizeChart() {
      if (weekChart !== null && !weekChart.isDisposed()) {
        weekChart.resize();
      }
    }
    window.addEventListener("resize", resizeChart);

    return () => {
      // clean up after component unmounts
      weekChart.dispose();
      weekChart = null;
      window.removeEventListener("resize", resizeChart);
    };
  });

	return {};
}

class WeekChart extends SvelteComponentDev {
	constructor(options) {
		super(options);
		init(this, options, instance$4, create_fragment$5, safe_not_equal, []);
	}
}

/* src\charts\BDAChart.svelte generated by Svelte v3.5.1 */

const file$6 = "src\\charts\\BDAChart.svelte";

function create_fragment$6(ctx) {
	var div;

	return {
		c: function create() {
			div = element("div");
			div.id = "BDAChart";
			div.className = "svelte-1j0o2bd";
			add_location(div, file$6, 70, 0, 1430);
		},

		l: function claim(nodes) {
			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
		},

		m: function mount(target, anchor) {
			insert(target, div, anchor);
		},

		p: noop,
		i: noop,
		o: noop,

		d: function destroy(detaching) {
			if (detaching) {
				detach(div);
			}
		}
	};
}

function instance$5($$self) {
	onMount(() => {
    let BDAChart = echarts.init(document.getElementById("BDAChart"));
    const option = {
      grid: {
        left: 36,
        top: 5,
        right: 0,
        bottom: 29
      },
      xAxis: {
        type: "category",
        data: ["Before", "During", "After"]
      },
      yAxis: {
        axisLabel: {
          showMaxLabel: false
        }
      },
      series: [
        {
          data: [4.6, 5.8, 4.9],
          type: "line",
          symbol: "triangle",
          symbolSize: 10
        },
        {
          data: [3.6, 6.8, 4.9],
          type: "line",
          symbol: "circle",
          symbolSize: 10
        },
        {
          data: [3.2, 2.8, 1.1],
          type: "line",
          symbol: "square",
          symbolSize: 10
        }
      ]
    };

    BDAChart.setOption(option);

    function resizeChart() {
      if (BDAChart !== null && !BDAChart.isDisposed()) {
        BDAChart.resize();
      }
    }
    window.addEventListener("resize", resizeChart);

    return () => {
      // clean up after component unmounts
      BDAChart.dispose();
      BDAChart = null;
      window.removeEventListener("resize", resizeChart);
    };
  });

	return {};
}

class BDAChart extends SvelteComponentDev {
	constructor(options) {
		super(options);
		init(this, options, instance$5, create_fragment$6, safe_not_equal, []);
	}
}

/* src\charts\ContextPie.svelte generated by Svelte v3.5.1 */

const file$7 = "src\\charts\\ContextPie.svelte";

function create_fragment$7(ctx) {
	var div;

	return {
		c: function create() {
			div = element("div");
			div.id = "ContextPieChart";
			div.className = "svelte-8xdxio";
			add_location(div, file$7, 101, 0, 2454);
		},

		l: function claim(nodes) {
			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
		},

		m: function mount(target, anchor) {
			insert(target, div, anchor);
		},

		p: noop,
		i: noop,
		o: noop,

		d: function destroy(detaching) {
			if (detaching) {
				detach(div);
			}
		}
	};
}

function instance$6($$self) {
	let labelFontSize = window.devicePixelRatio <= 1 ? 18 : 12;
  onMount(() => {
    let ContextPieChart = echarts.init(
      document.getElementById("ContextPieChart")
    );
    const option = {
      backgroundColor: "#fff",

      tooltip: {
        trigger: "item",
        formatter: "{a} <br/>{b} : {c} ({d}%)"
      },

      visualMap: {
        show: false,
        min: 0,
        max: 60,
        inRange: {
          colorLightness: [0, 1]
        }
      },
      series: [
        {
          name: "Context Activities",
          type: "pie",
          radius: "69%",
          center: ["50%", "50%"],
          data: [
            { value: 43, name: "Television" },
            { value: 11, name: "Sports" },
            { value: 37, name: "Work" },
            { value: 23, name: "Leisure" },
            { value: 5, name: "Sleep" }
          ].sort(function(a, b) {
            return a.value - b.value;
          }),
          roseType: "radius",
          label: {
            normal: {
              textStyle: {
                fontSize: labelFontSize,
                color: "#333"
              }
            }
          },
          labelLine: {
            normal: {
              lineStyle: {
                color: "#333"
              },
              smooth: 0.2,
              length: 10,
              length2: 20
            }
          },
          itemStyle: {
            normal: {
              color: "#c23531",
              shadowBlur: 20,
              shadowColor: "rgba(0, 0, 0, 0.5)"
            }
          },

          animationType: "scale",
          animationEasing: "elasticOut",
          animationDelay: function(idx) {
            return Math.random() * 200;
          }
        }
      ]
    };

    ContextPieChart.setOption(option);

    function resizeChart() {
      if (ContextPieChart !== null && !ContextPieChart.isDisposed()) {
        ContextPieChart.resize();
      }
    }
    window.addEventListener("resize", resizeChart);

    return () => {
      // clean up after component unmounts
      ContextPieChart.dispose();
      ContextPieChart = null;
      window.removeEventListener("resize", resizeChart);
    };
  });

	return {};
}

class ContextPie extends SvelteComponentDev {
	constructor(options) {
		super(options);
		init(this, options, instance$6, create_fragment$7, safe_not_equal, []);
	}
}

/* src\pages\Userview.svelte generated by Svelte v3.5.1 */

const file$8 = "src\\pages\\Userview.svelte";

function create_fragment$8(ctx) {
	var div6, div0, select, option0, option1, option2, option3, option4, t5, div5, div1, t6, div2, t7, div3, t8, div4, div6_intro, current;

	var anova = new Anova({ $$inline: true });

	var weekchart = new WeekChart({ $$inline: true });

	var bdachart = new BDAChart({ $$inline: true });

	var contextpie = new ContextPie({ $$inline: true });

	return {
		c: function create() {
			div6 = element("div");
			div0 = element("div");
			select = element("select");
			option0 = element("option");
			option0.textContent = "User 1 | avg. availability: 6.3 | responses: 223\r\n      ";
			option1 = element("option");
			option1.textContent = "User 2 | avg. availability: 2.3 | responses: 124\r\n      ";
			option2 = element("option");
			option2.textContent = "User 3 | avg. availability: 3.1 | responses: 24";
			option3 = element("option");
			option3.textContent = "User 4 | avg. availability: 4.3 | responses: 424\r\n      ";
			option4 = element("option");
			option4.textContent = "User 5 | avg. availability: 3.3 | responses: 254";
			t5 = space();
			div5 = element("div");
			div1 = element("div");
			anova.$$.fragment.c();
			t6 = space();
			div2 = element("div");
			weekchart.$$.fragment.c();
			t7 = space();
			div3 = element("div");
			bdachart.$$.fragment.c();
			t8 = space();
			div4 = element("div");
			contextpie.$$.fragment.c();
			option0.__value = "1";
			option0.value = option0.__value;
			add_location(option0, file$8, 37, 6, 905);
			option1.__value = "2";
			option1.value = option1.__value;
			add_location(option1, file$8, 40, 6, 1006);
			option2.__value = "3";
			option2.value = option2.__value;
			add_location(option2, file$8, 43, 6, 1107);
			option3.__value = "4";
			option3.value = option3.__value;
			add_location(option3, file$8, 44, 6, 1189);
			option4.__value = "5";
			option4.value = option4.__value;
			add_location(option4, file$8, 47, 6, 1290);
			select.name = "user";
			select.id = "userSelect";
			add_location(select, file$8, 36, 4, 861);
			div0.className = "optionsContainer svelte-1ci0qxq";
			add_location(div0, file$8, 35, 2, 825);
			div1.className = "widget svelte-1ci0qxq";
			add_location(div1, file$8, 65, 4, 1881);
			div2.className = "widget svelte-1ci0qxq";
			add_location(div2, file$8, 68, 4, 1936);
			div3.className = "widget svelte-1ci0qxq";
			add_location(div3, file$8, 71, 4, 1995);
			div4.className = "widget svelte-1ci0qxq";
			add_location(div4, file$8, 74, 4, 2053);
			div5.className = "widgetContainer svelte-1ci0qxq";
			add_location(div5, file$8, 64, 2, 1846);
			div6.className = "userview svelte-1ci0qxq";
			add_location(div6, file$8, 34, 0, 771);
		},

		l: function claim(nodes) {
			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
		},

		m: function mount(target, anchor) {
			insert(target, div6, anchor);
			append(div6, div0);
			append(div0, select);
			append(select, option0);
			append(select, option1);
			append(select, option2);
			append(select, option3);
			append(select, option4);
			append(div6, t5);
			append(div6, div5);
			append(div5, div1);
			mount_component(anova, div1, null);
			append(div5, t6);
			append(div5, div2);
			mount_component(weekchart, div2, null);
			append(div5, t7);
			append(div5, div3);
			mount_component(bdachart, div3, null);
			append(div5, t8);
			append(div5, div4);
			mount_component(contextpie, div4, null);
			current = true;
		},

		p: noop,

		i: function intro(local) {
			if (current) return;
			anova.$$.fragment.i(local);

			weekchart.$$.fragment.i(local);

			bdachart.$$.fragment.i(local);

			contextpie.$$.fragment.i(local);

			if (!div6_intro) {
				add_render_callback(() => {
					div6_intro = create_in_transition(div6, fade, { duration: 300 });
					div6_intro.start();
				});
			}

			current = true;
		},

		o: function outro(local) {
			anova.$$.fragment.o(local);
			weekchart.$$.fragment.o(local);
			bdachart.$$.fragment.o(local);
			contextpie.$$.fragment.o(local);
			current = false;
		},

		d: function destroy(detaching) {
			if (detaching) {
				detach(div6);
			}

			anova.$destroy();

			weekchart.$destroy();

			bdachart.$destroy();

			contextpie.$destroy();
		}
	};
}

class Userview extends SvelteComponentDev {
	constructor(options) {
		super(options);
		init(this, options, null, create_fragment$8, safe_not_equal, []);
	}
}

/* src\charts\MainChart.svelte generated by Svelte v3.5.1 */

const file$9 = "src\\charts\\MainChart.svelte";

function create_fragment$9(ctx) {
	var div;

	return {
		c: function create() {
			div = element("div");
			div.id = "mainChart";
			set_style(div, "width", "100%");
			set_style(div, "height", "100%");
			add_location(div, file$9, 245, 0, 4908);
		},

		l: function claim(nodes) {
			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
		},

		m: function mount(target, anchor) {
			insert(target, div, anchor);
		},

		p: noop,
		i: noop,
		o: noop,

		d: function destroy(detaching) {
			if (detaching) {
				detach(div);
			}
		}
	};
}

function instance$7($$self) {
	onMount(() => {
    let mainChart = echarts.init(document.getElementById("mainChart"));

    // TODO find alternative for this workaround
    var hours = [
      "08:00",
      "",
      "09:00",
      "",
      "10:00",
      "",
      "11:00",
      "",
      "12:00",
      "",
      "13:00",
      "",
      "14:00",
      "",
      "15:00",
      "",
      "16:00",
      "",
      "17:00",
      "",
      "18:00",
      "",
      "19:00",
      "",
      "20:00",
      "",
      "21:00",
      "",
      "22:00",
      "",
      "23:00",
      "",
      "24:00"
    ];
    var days = [
      "",
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
      "Sunday"
    ];
    var data = [
      [1, 1, 5],
      [1, 3, 3],
      [1, 5, 2],
      [1, 7, 1],
      [1, 9, 0],
      [1, 11, 0.5],
      [1, 13, 0.5],
      [1, 15, 3],
      [1, 17, 5],
      [1, 19, 5.5],
      [1, 21, 5.2],
      [1, 23, 6.1],
      [1, 25, 3],
      [1, 27, 6],
      [1, 29, 1],
      [1, 31, 2],
      [2, 1, 5],
      [2, 3, 2],
      [2, 5, 2],
      [2, 7, 0.5],
      [2, 9, 1],
      [2, 11, 1.5],
      [2, 13, 1.5],
      [2, 15, 3.5],
      [2, 17, 6],
      [2, 19, 4.5],
      [2, 21, 4.5],
      [2, 23, 5.5],
      [2, 25, 4],
      [2, 27, 5],
      [2, 29, 1.2],
      [2, 31, 5],
      [3, 1, 3],
      [3, 3, 1.5],
      [3, 5, 2],
      [3, 7, 1],
      [3, 9, 2],
      [3, 11, 2],
      [3, 13, 0.75],
      [3, 15, 2],
      [3, 17, 4],
      [3, 19, 3.5],
      [3, 21, 4],
      [3, 23, 5.75],
      [3, 25, 5],
      [3, 27, 3],
      [3, 29, 3],
      [3, 31, 2.5],
      [4, 1, 3.5],
      [4, 3, 2],
      [4, 5, 2],
      [4, 7, 2],
      [4, 9, 0.5],
      [4, 11, 1.5],
      [4, 13, 0.85],
      [4, 15, 1.5],
      [4, 17, 3],
      [4, 19, 5],
      [4, 21, 3.9],
      [4, 23, 4],
      [4, 25, 3.5],
      [4, 27, 4],
      [4, 29, 2],
      [4, 31, 3],
      [5, 1, 4],
      [5, 3, 1.4],
      [5, 5, 2],
      [5, 7, 1.5],
      [5, 9, 2],
      [5, 11, 0.5],
      [5, 13, 1.75],
      [5, 15, 2.85],
      [5, 17, 4.5],
      [5, 19, 5.1],
      [5, 21, 4.2],
      [5, 23, 3.5],
      [5, 25, 4],
      [5, 27, 4.5],
      [5, 29, 5],
      [5, 31, 4],
      [6, 1, 5],
      [6, 3, 1.5],
      [6, 5, 2],
      [6, 7, 1],
      [6, 9, 0],
      [6, 11, 0.75],
      [6, 13, 1.0],
      [6, 15, 2],
      [6, 17, 5.75],
      [6, 19, 4],
      [6, 21, 4.75],
      [6, 23, 6],
      [6, 25, 4.5],
      [6, 27, 3.23],
      [6, 29, 7],
      [6, 31, 0.5],
      [7, 1, 4.5],
      [7, 3, 1],
      [7, 5, 2],
      [7, 7, 0],
      [7, 9, 1],
      [7, 11, 1],
      [7, 13, 0.5],
      [7, 15, 3],
      [7, 17, 3],
      [7, 19, 4.75],
      [7, 21, 2],
      [7, 23, 5.5],
      [7, 25, 3.99],
      [7, 27, 6.5],
      [7, 29, 2],
      [7, 31, 1]
    ];

    const option = {
      legend: {
        data: ["Average availability"],
        left: "center"
      },
      tooltip: {
        position: "top",
        formatter: function(params) {
          // TODO implement function capable of translating params.value[1] into 'XX:00-XX:00'
          return "Average availability is " + params.value[2];
        }
      },
      grid: {
        top: 40,
        left: 2,
        bottom: 10,
        right: 30,
        containLabel: true
      },
      xAxis: {
        type: "category",
        boundaryGap: false,
        // name: "Day of week",
        data: days,
        splitLine: {
          show: true,
          lineStyle: {
            color: "#999",
            type: "dashed"
          }
        },
        axisLine: {
          show: true
        }
      },
      yAxis: {
        type: "category",
        boundaryGap: false,
        name: "Time of day",
        data: hours,
        axisLine: {
          show: true
        }
      },
      series: [
        {
          name: "Average availability",
          type: "scatter",
          symbolSize: function(val) {
            return val[2] * 6;
          },
          data: data,
          animationDelay: function(idx) {
            return idx * 5;
          }
        }
      ]
    };

    // use configuration item and data specified to show chart
    mainChart.setOption(option);

    function resizeChart() {
      if (mainChart !== null && !mainChart.isDisposed()) {
        mainChart.resize();
      }
    }
    window.addEventListener("resize", resizeChart);

    return () => {
      // clean up after component unmounts
      mainChart.dispose();
      mainChart = null;
      window.removeEventListener("resize", resizeChart);
    };
  });

	return {};
}

class MainChart extends SvelteComponentDev {
	constructor(options) {
		super(options);
		init(this, options, instance$7, create_fragment$9, safe_not_equal, []);
	}
}

/* src\charts\MainChartSummary.svelte generated by Svelte v3.5.1 */

const file$a = "src\\charts\\MainChartSummary.svelte";

function create_fragment$a(ctx) {
	var div;

	return {
		c: function create() {
			div = element("div");
			div.id = "mainChartSummary";
			set_style(div, "width", "100%");
			set_style(div, "height", "100%");
			add_location(div, file$a, 134, 0, 2762);
		},

		l: function claim(nodes) {
			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
		},

		m: function mount(target, anchor) {
			insert(target, div, anchor);
		},

		p: noop,
		i: noop,
		o: noop,

		d: function destroy(detaching) {
			if (detaching) {
				detach(div);
			}
		}
	};
}

function instance$8($$self) {
	onMount(() => {
    let mainChartSummary = echarts.init(
      document.getElementById("mainChartSummary")
    );

    const option = {
      tooltip: {
        trigger: "axis",
        formatter: "Average availability : <br/>{b}h : {c}"
      },
      grid: {
        top: 40,
        left: 2,
        bottom: 10,
        right: 50,
        containLabel: true
      },
      xAxis: {
        type: "value",
        name: "Avail."
      },
      yAxis: {
        type: "category",
        axisLine: { onZero: true },
        boundaryGap: false,
        name: "Time of day",
        data: [
          "08:00",
          "",
          "09:00",
          "",
          "10:00",
          "",
          "11:00",
          "",
          "12:00",
          "",
          "13:00",
          "",
          "14:00",
          "",
          "15:00",
          "",
          "16:00",
          "",
          "17:00",
          "",
          "18:00",
          "",
          "19:00",
          "",
          "20:00",
          "",
          "21:00",
          "",
          "22:00",
          "",
          "23:00",
          "",
          "24:00"
        ]
      },
      series: [
        {
          name: "Average availability",
          type: "line",
          smooth: false, // disable interpolation
          lineStyle: {
            normal: {
              width: 3,
              shadowColor: "rgba(0,0,0,0.4)",
              shadowBlur: 10,
              shadowOffsetY: 10
            }
          },
          data: [
            1,
            2.5,
            3.8,
            7,
            5,
            4,
            4,
            4,
            4,
            5,
            5,
            5,
            2,
            2,
            2,
            3.5,
            3.5,
            3.5,
            4,
            4,
            4,
            4.5,
            3,
            3,
            3,
            3,
            2.5,
            2,
            5,
            6,
            4,
            3.75,
            2
          ]
        }
      ]
    };

    // use configuration item and data specified to show chart
    mainChartSummary.setOption(option);
    function resizeChart() {
      if (mainChartSummary !== null && !mainChartSummary.isDisposed()) {
        mainChartSummary.resize();
      }
    }
    window.addEventListener("resize", resizeChart);

    return () => {
      // clean up after component unmounts
      mainChartSummary.dispose();
      mainChartSummary = null;
      window.removeEventListener("resize", resizeChart);
    };
  });

	return {};
}

class MainChartSummary extends SvelteComponentDev {
	constructor(options) {
		super(options);
		init(this, options, instance$8, create_fragment$a, safe_not_equal, []);
	}
}

/* src\charts\Sherlock.svelte generated by Svelte v3.5.1 */

const file$b = "src\\charts\\Sherlock.svelte";

function create_fragment$b(ctx) {
	var div0, svg1, g1, g0, svg0, path, t0, span, t2, div1;

	return {
		c: function create() {
			div0 = element("div");
			svg1 = svg_element("svg");
			g1 = svg_element("g");
			g0 = svg_element("g");
			svg0 = svg_element("svg");
			path = svg_element("path");
			t0 = space();
			span = element("span");
			span.textContent = "Sherlock";
			t2 = space();
			div1 = element("div");
			attr(path, "d", "M-823.5,558.3c-4.8-0.3-4.4,1.6-4.4,1.6l0.2,4.6c0,0,0,2.4-1.4,2.3s-1.8-2.8-1.8-2.8s-1.1-4.6-1.1-4.6\r\n            c0-0.1,0.1-0.3,0.1-0.4c0.1-0.3,0.1-0.7,0-1c-0.1-0.7-0.2-1.5-0.7-2.1c0,0-0.8-0.5-0.8-0.4c-0.5-3.4-2.2-6.8-5.7-7.8\r\n            c-0.2-0.1-2.5-0.5-3.6-0.7c0.1-0.3,0.3-0.6,0.4-0.9c0.3-1.2-0.4-2.3-0.8-3.3c-0.3-1-0.2-1.9,1-2c1.1-0.1,3.1,1,3.7,0.8\r\n            c0.7-0.1,1.5-0.7,1.5-1.5s-1.2-2.5-1.2-2.5s-1.6-3.2-2.1-4.6c-0.5-1.4-2.3-2.7-2.3-2.7s-1.8-1.3-1.6-2.2c0.2-0.9,0.9-1.2,1.2-2.1\r\n            c1,0.1,2.1,0.4,2.9,0.5c2.9,0.4,6.7,1.2,9,0.7c0,0,1.2-0.1,0-1c-1.2-0.9-4.1-3.7-5-4.7s-4.1-3.1-4.7-4.4c-1.9-3.9-2.4-8.6-5.6-11.9\r\n            c-2.3-2.4-5.2-4.3-8.2-5.6c1.1,0.2,2.2,0.3,3.3,0.3c0.1,0,0.3,0,0.4,0l0-0.9c-2.8,0.1-6-0.6-8.3-1.2c0.5,0,1-0.1,1.6-0.3\r\n            c1-0.3,2.9-1.1,2.5-2.5c-0.5-1.9-3.8-1.3-5.1-1.1c-2.5,0.4-4.8,1.6-7,2.8c-0.3-0.4-0.8-0.5-1.4-0.4c-0.4,0.1-0.7,0.3-0.9,0.5\r\n            c-0.4-0.2-1.7-0.7-4.9-0.7c-2,0-8.9,2.1-5.3,4.4c-1.5,0.4-3.2,0.8-4.4,0.9l0.1,0.9c0.7-0.1,1.5-0.2,2.4-0.4\r\n            c-2.5,1.5-4.7,3.4-6.6,5.6c-2,2.3-3.1,5.4-3.5,8.3c-0.5,3.6,0.5,7.2,0.3,10.8c-0.2,1.9-1.2,2.8-2.2,4.3c-1,1.5-1.4,3.2-2.4,4.7\r\n            c-0.8,1.4-2.1,2.4-3.2,3.6c-0.4,0.4-0.3,0.7,0,0.8c0.1,0,0.2,0,0.4,0c0.8-0.1,1.5-0.5,2.2-0.7c1.1-0.3,2.2-0.6,3.2-1\r\n            c0.7-0.3,3-1,5.4-1.9c0.1,0.9,0.2,1.9,0.4,2.5c0.4,1.2,2.3,3.4,2.3,3.4s1.8,1.6,1.9,3.7c0,1.1-0.3,2-0.7,2.6c-0.6-0.4-2.2-1-3.6,0.8\r\n            c-1.8,2.3-2.5,4.4-3.4,5.6c-0.9,1.2-3,3.6-3.2,4.7c-0.2,1.1,0.8,2.3,0.8,2.3l-5.7,10.3c0,0,2.5,2.9,8.6,3.3\r\n            c6.1,0.4,6.5-1.3,14.3,0.8c7.8,2.1,12.2,13.9,27.5,12c0,0-2-6.2-4.5-9.9c-2.5-3.7-5.4-7.8-5.4-7.8c0.2-1.1,1.4-4.6,0.6-5.4\r\n            c-0.5-0.5-1-0.9-1.5-1.4c0.4-0.9,0.9-1.8,0.9-2.8c0-0.9-0.4-2-0.1-2.9c0.2-0.6,0.8-1,1.4-1c0.8,0,1.3,0.7,2.1,0.9\r\n            c0.8,0.2,2.1,0.1,2.9,0.1c0.9,0,1.7,0.7,2.5,0.9c2.1,0.7,4.4,0.4,5.9-1.3c1.6-1.8,0.3-3.6,0.3-3.6s-1.2-1.5-1.2-2.4\r\n            c0-0.9,0.7-1.6,0.7-1.6l0-0.1c0.1,0,0.2,0,0.3,0c0.7,0,1.3-0.5,1.3-1c0-0.2,0-0.3-0.1-0.4c0.5,0.1,1.2,0.2,1.3,0.2\r\n            c0.8,0.2,1.5,0.4,2.2,0.8c1.4,0.8,2.3,2.2,2.7,3.7c0.1,0.5,0.7,2.2,0.3,2.6c-0.3,0.3-0.4,1.1-0.4,1.5c0,0.8,0.3,1.7,0.8,2.3\r\n            c0.1,0.2,0.6,0.5,0.7,0.7c1.2,5.1,1.6,11.1,8.3,11.6c2.8,0.2,4.4-1.3,4.4-1.3s1.8-1.1,2.4-4.1c0.6-3,0.7-6.5,0.7-6.5\r\n            S-818.7,558.5-823.5,558.3z\r\n            M-865.4,497.4c-0.4,0-0.7,0-1.1,0c0,0,0-0.1,0-0.1C-866.3,497.4-865.9,497.4-865.4,497.4z\r\n            M-872.9,497.9\r\n            c0.3-0.1,2.5-0.4,3.4-0.4c0,0.1,0,0.1,0,0.2c-0.3,0-0.7,0.1-1,0.1c-1.6,0.2-3.3,0.6-4.9,1.2C-874.6,498.5-873.8,498-872.9,497.9z\r\n            M-878.4,498.2c1.6-0.8,2.9-0.9,4.7-1.1c-1.4,0.1-3.1,2.5-4.6,2C-878.7,498.9-878.9,498.5-878.4,498.2z\r\n            M-862,497.6\r\n            c0.1,0,0.3,0,0.4,0l0,0C-861.7,497.6-861.9,497.6-862,497.6z\r\n            M-860.9,496.5c-0.8-0.1-2.2-0.5-3-0.2c1.3-0.4,2.5-0.9,3.8-1.2\r\n            c0.7-0.1,1.4-0.2,2.1-0.1c1,0.2,1.1,0.9,0.2,1.4c0,0-0.1,0-0.1,0C-858.8,496.9-859.9,496.6-860.9,496.5z");
			add_location(path, file$b, 269, 10, 5908);
			attr(svg0, "fill", "#333");
			attr(svg0, "xmlns", "http://www.w3.org/2000/svg");
			attr(svg0, "xmlns:xlink", "http://www.w3.org/1999/xlink");
			attr(svg0, "version", "1.1");
			attr(svg0, "x", "0px");
			attr(svg0, "y", "0px");
			attr(svg0, "viewBox", "-909 491 100 100");
			set_style(svg0, "enable-background", "new -909 491 100 100");
			attr(svg0, "xml:space", "preserve");
			add_location(svg0, file$b, 259, 8, 5576);
			attr(g0, "transform", "translate(600 600) scale(-0.69 0.69) translate(-600 -600)");
			add_location(g0, file$b, 258, 6, 5493);
			add_location(g1, file$b, 257, 4, 5482);
			attr(svg1, "xmlns", "http://www.w3.org/2000/svg");
			attr(svg1, "xmlns:xlink", "http://www.w3.org/1999/xlink");
			attr(svg1, "width", "2.5em");
			attr(svg1, "height", "2.5em");
			attr(svg1, "viewBox", "0 0 1200 1200");
			add_location(svg1, file$b, 251, 2, 5315);
			add_location(span, file$b, 301, 2, 8982);
			div0.id = "sherlockHeader";
			div0.className = "svelte-nary1h";
			add_location(div0, file$b, 250, 0, 5286);
			div1.id = "sherlockChart";
			div1.className = "svelte-nary1h";
			add_location(div1, file$b, 303, 0, 9013);
		},

		l: function claim(nodes) {
			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
		},

		m: function mount(target, anchor) {
			insert(target, div0, anchor);
			append(div0, svg1);
			append(svg1, g1);
			append(g1, g0);
			append(g0, svg0);
			append(svg0, path);
			append(div0, t0);
			append(div0, span);
			insert(target, t2, anchor);
			insert(target, div1, anchor);
		},

		p: noop,
		i: noop,
		o: noop,

		d: function destroy(detaching) {
			if (detaching) {
				detach(div0);
				detach(t2);
				detach(div1);
			}
		}
	};
}

function instance$9($$self) {
	onMount(() => {
    let sherlockChart = echarts.init(document.getElementById("sherlockChart"));
    const dataAll = [
      [
        [10.0, 8.04],
        [8.0, 6.95],
        [13.0, 7.58],
        [9.0, 8.81],
        [11.0, 8.33],
        [14.0, 9.96],
        [6.0, 7.24],
        [4.0, 4.26],
        [12.0, 10.84],
        [7.0, 4.82],
        [5.0, 5.68]
      ],
      [
        [10.0, 9.14],
        [8.0, 8.14],
        [13.0, 8.74],
        [9.0, 8.77],
        [11.0, 9.26],
        [14.0, 8.1],
        [6.0, 6.13],
        [4.0, 3.1],
        [12.0, 9.13],
        [7.0, 7.26],
        [5.0, 4.74]
      ],
      [
        [10.0, 7.46],
        [8.0, 6.77],
        [13.0, 12.74],
        [9.0, 7.11],
        [11.0, 7.81],
        [14.0, 8.84],
        [6.0, 6.08],
        [4.0, 5.39],
        [12.0, 8.15],
        [7.0, 6.42],
        [5.0, 5.73]
      ],
      [
        [8.0, 6.58],
        [8.0, 5.76],
        [8.0, 7.71],
        [8.0, 8.84],
        [8.0, 8.47],
        [8.0, 7.04],
        [8.0, 5.25],
        [19.0, 12.5],
        [8.0, 5.56],
        [8.0, 7.91],
        [8.0, 6.89]
      ]
    ];

    const markLineOpt = {
      animation: false,
      label: {
        normal: {
          formatter: "y = 0.5 * x + 3",
          textStyle: {
            align: "right"
          }
        }
      },
      lineStyle: {
        normal: {
          type: "solid"
        }
      },
      tooltip: {
        formatter: "y = 0.5 * x + 3"
      },
      data: [
        [
          {
            coord: [0, 3],
            symbol: "none"
          },
          {
            coord: [20, 13],
            symbol: "none"
          }
        ]
      ]
    };

    const option = {
      grid: [
        { x: "10%", y: "7%", width: "32%", height: "25%" },
        { x2: "7%", y: "7%", width: "32%", height: "25%" },
        { x: "10%", y2: "27%", width: "32%", height: "25%" },
        { x2: "7%", y2: "27%", width: "32%", height: "25%" }
      ],
      tooltip: {
        formatter: "Group {a}: ({c})"
      },
      xAxis: [
        {
          gridIndex: 0,
          min: 0,
          max: 20,
          splitLine: {
            show: false
          }
        },
        {
          gridIndex: 1,
          min: 0,
          max: 20,
          splitLine: {
            show: false
          }
        },
        {
          gridIndex: 2,
          min: 0,
          max: 20,
          splitLine: {
            show: false
          }
        },
        {
          gridIndex: 3,
          min: 0,
          max: 20,
          splitLine: {
            show: false
          }
        }
      ],
      yAxis: [
        {
          gridIndex: 0,
          min: 0,
          max: 15,
          name: "***",
          nameGap: -10,
          nameTextStyle: {
            color: "black",
            fontSize: 16
          }
        },
        {
          gridIndex: 1,
          min: 0,
          max: 15,
          name: "**",
          nameGap: -10,
          nameTextStyle: {
            color: "black",
            fontSize: 16
          }
        },
        {
          gridIndex: 2,
          min: 0,
          max: 15,
          name: "**",
          nameGap: -10,
          nameTextStyle: {
            color: "black",
            fontSize: 16
          }
        },
        {
          gridIndex: 3,
          min: 0,
          max: 15,
          name: "*",
          nameGap: -10,
          nameTextStyle: {
            color: "black",
            fontSize: 16
          }
        }
      ],
      series: [
        {
          name: "I",
          type: "scatter",
          xAxisIndex: 0,
          yAxisIndex: 0,
          data: dataAll[0],
          markLine: markLineOpt
        },
        {
          name: "II",
          type: "scatter",
          xAxisIndex: 1,
          yAxisIndex: 1,
          data: dataAll[1],
          markLine: markLineOpt
        },
        {
          name: "III",
          type: "scatter",
          xAxisIndex: 2,
          yAxisIndex: 2,
          data: dataAll[2],
          markLine: markLineOpt
        },
        {
          name: "IV",
          type: "scatter",
          xAxisIndex: 3,
          yAxisIndex: 3,
          data: dataAll[3],
          markLine: markLineOpt
        }
      ]
    };
    sherlockChart.setOption(option);

    function resizeChart() {
      if (sherlockChart !== null && !sherlockChart.isDisposed()) {
        sherlockChart.resize();
      }
    }
    window.addEventListener("resize", resizeChart);

    return () => {
      // clean up after component unmounts
      sherlockChart.dispose();
      sherlockChart = null;
      window.removeEventListener("resize", resizeChart);
    };
  });

	return {};
}

class Sherlock extends SvelteComponentDev {
	constructor(options) {
		super(options);
		init(this, options, instance$9, create_fragment$b, safe_not_equal, []);
	}
}

/* src\pages\Overview.svelte generated by Svelte v3.5.1 */

const file$c = "src\\pages\\Overview.svelte";

function create_fragment$c(ctx) {
	var div3, div0, t0, div1, t1, aside, t2, div2, div3_intro, current;

	var mainchart = new MainChart({ $$inline: true });

	var mainchartsummary = new MainChartSummary({ $$inline: true });

	var sherlock = new Sherlock({ $$inline: true });

	var anova = new Anova({ $$inline: true });

	return {
		c: function create() {
			div3 = element("div");
			div0 = element("div");
			mainchart.$$.fragment.c();
			t0 = space();
			div1 = element("div");
			mainchartsummary.$$.fragment.c();
			t1 = space();
			aside = element("aside");
			sherlock.$$.fragment.c();
			t2 = space();
			div2 = element("div");
			anova.$$.fragment.c();
			div0.className = "mainChart svelte-1xa894k";
			add_location(div0, file$c, 45, 2, 1099);
			div1.className = "mainChartSummary svelte-1xa894k";
			add_location(div1, file$c, 48, 2, 1155);
			aside.className = "svelte-1xa894k";
			add_location(aside, file$c, 51, 2, 1225);
			div2.className = "anova svelte-1xa894k";
			add_location(div2, file$c, 54, 2, 1266);
			div3.className = "overview svelte-1xa894k";
			add_location(div3, file$c, 44, 0, 1045);
		},

		l: function claim(nodes) {
			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
		},

		m: function mount(target, anchor) {
			insert(target, div3, anchor);
			append(div3, div0);
			mount_component(mainchart, div0, null);
			append(div3, t0);
			append(div3, div1);
			mount_component(mainchartsummary, div1, null);
			append(div3, t1);
			append(div3, aside);
			mount_component(sherlock, aside, null);
			append(div3, t2);
			append(div3, div2);
			mount_component(anova, div2, null);
			current = true;
		},

		p: noop,

		i: function intro(local) {
			if (current) return;
			mainchart.$$.fragment.i(local);

			mainchartsummary.$$.fragment.i(local);

			sherlock.$$.fragment.i(local);

			anova.$$.fragment.i(local);

			if (!div3_intro) {
				add_render_callback(() => {
					div3_intro = create_in_transition(div3, fade, { duration: 300 });
					div3_intro.start();
				});
			}

			current = true;
		},

		o: function outro(local) {
			mainchart.$$.fragment.o(local);
			mainchartsummary.$$.fragment.o(local);
			sherlock.$$.fragment.o(local);
			anova.$$.fragment.o(local);
			current = false;
		},

		d: function destroy(detaching) {
			if (detaching) {
				detach(div3);
			}

			mainchart.$destroy();

			mainchartsummary.$destroy();

			sherlock.$destroy();

			anova.$destroy();
		}
	};
}

class Overview extends SvelteComponentDev {
	constructor(options) {
		super(options);
		init(this, options, null, create_fragment$c, safe_not_equal, []);
	}
}

function flip(node, animation, params) {
    const style = getComputedStyle(node);
    const transform = style.transform === 'none' ? '' : style.transform;
    const dx = animation.from.left - animation.to.left;
    const dy = animation.from.top - animation.to.top;
    const d = Math.sqrt(dx * dx + dy * dy);
    const { delay = 0, duration = d => Math.sqrt(d) * 120, easing = cubicOut } = params;
    return {
        delay,
        duration: is_function(duration) ? duration(d) : duration,
        easing,
        css: (_t, u) => `transform: ${transform} translate(${u * dx}px, ${u * dy}px);`
    };
}

const dbName = "senseQ";
const dbVersion = 1;

let request = window.indexedDB.open(dbName, dbVersion);
let db;
let store;

// is only called once for each version number
// init database with stores needed for application
request.onupgradeneeded = (e) => {
    db = e.target.result;

    // Setup all stores

    // holds general study info
    store = db.createObjectStore("Studies", { keyPath: "_id" });
    store.createIndex("studyName", "studyName", { unique: false });
    store.createIndex("created", "__created", { unique: false });

    // later used to quickly lookup task properties to distinguish btw. demographics and regular questions
    store = db.createObjectStore("StudyTasks", { keyPath: "taskId" });
    store.createIndex("studyId", "studyId", { unique: false });

    // later used to quickly lookup variable types
    store = db.createObjectStore("StudyVariables", { keyPath: ["variableName", "studyId"] });
    store.createIndex("variableName", "variableName", { unique: false });
    store.createIndex("studyId", "studyId", { unique: false });
    store.createIndex("measure", "measure", { unique: false });
    // store = db.createObjectStore("StudyVariables", { autoIncrement: true })
    // store.createIndex("studyId", "studyId", { unique: false })
    // store.createIndex("variableName", "variableName", { unique: false })

    // not sure if really needed
    store = db.createObjectStore("Users", { keyPath: ["userId", "studyId"] });
    store.createIndex("userId", "userId", { unique: false });
    store.createIndex("studyId", "studyId", { unique: false });

    // store holding all demographics of each user (where task.personalData == true)
    store = db.createObjectStore("Demographics", { keyPath: ["userId", "variableName"] });
    store.createIndex("userId", "userId", { unique: false });
    store.createIndex("variableName", "variableName", { unique: false });

    // holds all results from all questionnaires
    store = db.createObjectStore("TaskResults", { autoIncrement: true });
    store.createIndex("taskId", "taskId", { unique: false });
    store.createIndex("userId", "userId", { unique: false });
    store.createIndex("studyId", "studyId", { unique: false });
    store.createIndex("resultVariable", "resultVariable", { unique: false });
    store.createIndex("resultDate", "resultDate", { unique: false });

    // holds all details on study responses
    store = db.createObjectStore("StudyResponses", { keyPath: ["userId", "studyId", "startDate"] });
    store.createIndex("userId", "userId", { unique: false });
    store.createIndex("studyId", "studyId", { unique: false });
    store.createIndex("taskId", "taskId", { unique: false });

};

request.onerror = (e) => {
    console.error("indexedDb error: open db", e.target);
};

function globalError(e) {
    console.error(`indexedDb error: ${e.target.error.message}`, e.target);
}

// get database interface if opening was successful
request.onsuccess = (e) => {
    db = e.target.result;
    db.onerror = globalError;

    // // get current studies (order by date imported asc)
    // const res = db.transaction("Studies").objectStore("Studies").index("created").openCursor(null, "next")
    // res.onsuccess = (e) => {
    //     const cursor = e.target.result;
    //     if (cursor) {
    //         studyStore.update(studies => [...studies, cursor.value]);
    //         cursor.continue()
    //     }
    // }

    // get current studies
    db.transaction("Studies").objectStore("Studies").getAll().onsuccess = (e) => {
        studyStore.set(e.target.result);
    };

    db.transaction("StudyVariables").objectStore("StudyVariables").getAll().onsuccess = e => {
        variableStore.set(e.target.result);
    };
};

/* src\components\StudyImporter.svelte generated by Svelte v3.5.1 */

const file$d = "src\\components\\StudyImporter.svelte";

function create_fragment$d(ctx) {
	var input, t0, label, figure, svg, path, t1;

	return {
		c: function create() {
			input = element("input");
			t0 = space();
			label = element("label");
			figure = element("figure");
			svg = svg_element("svg");
			path = svg_element("path");
			t1 = text("\r\n    Import study data");
			input.id = "studyImport";
			attr(input, "type", "file");
			input.multiple = true;
			input.accept = "application/json";
			input.className = "svelte-1ftga8c";
			add_location(input, file$d, 288, 0, 11352);
			attr(path, "fill", "white");
			attr(path, "d", "M10 0l-5.2 4.9h3.3v5.1h3.8v-5.1h3.3l-5.2-4.9zm9.3\r\n        11.5l-3.2-2.1h-2l3.4 2.6h-3.5c-.1 0-.2.1-.2.1l-.8\r\n        2.3h-6l-.8-2.2c-.1-.1-.1-.2-.2-.2h-3.6l3.4-2.6h-2l-3.2 2.1c-.4.3-.7 1-.6\r\n        1.5l.6 3.1c.1.5.7.9 1.2.9h16.3c.6 0 1.1-.4\r\n        1.3-.9l.6-3.1c.1-.5-.2-1.2-.7-1.5z");
			add_location(path, file$d, 296, 6, 11593);
			attr(svg, "xmlns", "http://www.w3.org/2000/svg");
			attr(svg, "width", "2em");
			attr(svg, "height", "1.8em");
			attr(svg, "viewBox", "0 0 20 17");
			add_location(svg, file$d, 291, 4, 11470);
			add_location(figure, file$d, 290, 2, 11456);
			label.htmlFor = "studyImport";
			label.className = "svelte-1ftga8c";
			add_location(label, file$d, 289, 0, 11427);
		},

		l: function claim(nodes) {
			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
		},

		m: function mount(target, anchor) {
			insert(target, input, anchor);
			insert(target, t0, anchor);
			insert(target, label, anchor);
			append(label, figure);
			append(figure, svg);
			append(svg, path);
			append(label, t1);
		},

		p: noop,
		i: noop,
		o: noop,

		d: function destroy(detaching) {
			if (detaching) {
				detach(input);
				detach(t0);
				detach(label);
			}
		}
	};
}

function instance$a($$self, $$props, $$invalidate) {
	let $variableStore;

	validate_store(variableStore, 'variableStore');
	subscribe($$self, variableStore, $$value => { $variableStore = $$value; $$invalidate('$variableStore', $variableStore); });

	
  onMount(() => {
    const el = document.getElementById("studyImport");
    el.onchange = () => {
      for (const file of el.files) {
        //console.log(file);
        if (file.type !== "application/json") {
          console.error("invalid file type");
          continue;
        }
        // read file contents
        const reader = new FileReader();
        console.log("importing file: ", file.name);
        reader.readAsText(file);
        reader.onload = e => {
          const text = reader.result;
          console.log("file reader finished importing");
          try {
            console.log("parsing json file: ", file.name);
            let jsn = JSON.parse(text);
            console.log("finished parsing file");
            // console.log(jsn);

            // --------------- import study into database
            // if it is not an array it only contains data of one study
            if (!(jsn instanceof Array)) {
              jsn = [jsn];
            }

            // import data of each study
            for (const importData of jsn) {
              // console.log("import study: ", importData);
              // sanity checks:
              if (!importData.hasOwnProperty("dataSchema")) {
                console.error("missing prop: dataSchema");
                return;
              }

              const study = importData.dataSchema;
              if (!study.hasOwnProperty("_id")) {
                console.error("missing prop: _id");
                return;
              }
              if (!study.hasOwnProperty("studyName")) {
                console.error("missing prop: studyName");
                return;
              }
              if (!study.hasOwnProperty("description")) {
                console.error("missing prop: description");
                return;
              }

              // insert study data into db
              if (!db) {
                console.error("missing database object");
                return;
              }

              const tx = db.transaction(
                ["Studies", "StudyVariables", "StudyTasks"],
                "readwrite"
              );
              const store = tx.objectStore("Studies");

              study.__created = new Date();
              const result = store.add(study);
              result.onerror = event => {
                // ConstraintError occurs when an object with the same id already exists
                if (result.error.name == "ConstraintError") {
                  if (
                    confirm(
                      "This study already exists, do you want to replace it?"
                    )
                  ) {
                    console.log("replace study");
                    event.preventDefault(); // don't abort the transaction
                    event.stopPropagation();
                    event.target.source.put(study); //source -> objectStore for this event
                    result.onsuccess();
                  } else {
                    console.log("don't replace study");
                  }
                }
              };

              // if study data were successfully created: store used tasks
              result.onsuccess = () => {
                const taskStore = tx.objectStore("StudyTasks");
                const studyId = study._id;
                for (const task of study.tasks) {
                  const taskData = {
                    studyId: studyId,
                    taskId: task._id,
                    taskName: task.taskName,
                    personalData: JSON.parse(task.personalData) // cast string "false" to boolean false
                  };
                  //Update StudyTasks
                  taskStore.put(taskData);
                }

                // generate StudyVariables
                const studyVars = new Map();
                // Step 1: get variable definition of each task
                for (const task of study.tasks) {
                  // map specific questionnaire types to statistical types
                  const typeMapping = new Map([
                    ["Numeric", "scale"],
                    ["TextChoice", "nominal"],
                    ["DiscreteScale", "scale"], //FIXME: check answer labels
                    ["ContinuousScale", "scale"],
                    ["Text", "qualitative"]
                  ]);
                  for (const step of task.steps) {
                    for (const stepItem of step.stepItems) {
                      stepItem.__created = new Date();
                      stepItem.studyId = studyId;
                      stepItem.measure = typeMapping.get(
                        stepItem.dataformat.type
                      );
                      stepItem.results = []; // used to hold all task results for this variable
                      studyVars.set(
                        `${studyId}|${stepItem.variableName}`,
                        stepItem
                      );
                    }
                  }
                }
                // Step 2: check if there are any results in this import that contain these variables
                if (
                  importData.hasOwnProperty("taskResults") &&
                  importData.taskResults instanceof Array
                ) {
                  for (const taskResult of importData.taskResults) {
                    for (const step of taskResult.stepResults) {
                      for (const stepItem of step.stepItemResults) {
                        const key = `${studyId}|${stepItem.variableName}`;
                        const variable = studyVars.get(key);
                        if (variable) {
                          variable.results.push({
                            value: stepItem.value,
                            date: stepItem.startDate,
                            uid: taskResult.userId
                          });
                          studyVars.set(key, variable);
                        }
                      }
                    }
                  }
                }
                // console.log(studyVars);
                // Step 3: save variables in db
                const studyVariables = tx.objectStore("StudyVariables");
                for (const variable of studyVars.values()) {
                  studyVariables.put(variable);
                }
                // notify variable store
                variableStore.set([...$variableStore, ...studyVars.values()]);

                // notify study store (it's faster this way)
                tx.objectStore("Studies").getAll().onsuccess = e =>
                  studyStore.set(e.target.result);
              };

              // ---------- Import task results
              // check if there are any questionnaire/task results in the import file
              if (
                importData.hasOwnProperty("taskResults") &&
                importData.taskResults instanceof Array
              ) {
                const tx = db.transaction(
                  [
                    "Users",
                    "Demographics",
                    "TaskResults",
                    "StudyTasks",
                    "StudyResponses"
                  ],
                  "readwrite"
                );

                // importing questionnaire/task results
                for (const taskResult of importData.taskResults) {
                  // TODO: check if props exist
                  const { studyId, taskId, userId } = taskResult;
                  //find task to which these results belong
                  const res = tx.objectStore("StudyTasks").get(taskId);
                  res.onsuccess = e => {
                    const taskInfo = e.target.result;
                    if (taskInfo.personalData === true) {
                      // also import personal data into store Demographics
                      const store = tx.objectStore("Demographics");
                      for (const step of taskResult.stepResults) {
                        for (const stepItem of step.stepItemResults) {
                          const data = {
                            userId: userId,
                            variableName: stepItem.variableName,
                            taskId: taskId,
                            value: stepItem.value,
                            __created: new Date()
                          };
                          store.put(data); // replace existing data
                        }
                      }
                    }

                    // import results
                    const store = tx.objectStore("TaskResults");
                    for (const step of taskResult.stepResults) {
                      for (const stepItem of step.stepItemResults) {
                        const {
                          value: resultValue,
                          variableName: resultVariable,
                          startDate: resultDate
                        } = stepItem;
                        const data = {
                          studyId: studyId,
                          userId: userId,
                          taskId: taskId,
                          resultVariable,
                          resultValue,
                          resultDate,
                          stepItem, // also store original data from import file
                          __created: new Date()
                        };
                        store.add(data);
                      }
                    }
                  };

                  // update user table
                  const store = tx.objectStore("Users");
                  const user = {
                    userId: taskResult.userId,
                    studyId: studyId,
                    __created: new Date()
                  };
                  store.put(user);

                  // add response info
                  tx.objectStore("StudyResponses").put(taskResult);
                } // for each taskResult
              } // end of task result import
              //alert(`Study results for "${study.studyName}" were imported`);
            }
          } catch (error) {
            console.error(`Error importing ${file.name}: `, error);
          }
        };
      }
    };
  });

	return {};
}

class StudyImporter extends SvelteComponentDev {
	constructor(options) {
		super(options);
		init(this, options, instance$a, create_fragment$d, safe_not_equal, []);
	}
}

function formatDate(date) {
    let dayOfMonth = date.getDate();
    let month = date.getMonth() + 1;
    let year = date.getFullYear();
    let hour = date.getHours();
    let minutes = date.getMinutes();
    let diffMs = new Date() - date;
    let diffSec = Math.round(diffMs / 1000);
    let diffMin = diffSec / 60;
    let diffHour = diffMin / 60;

    year = year.toString().slice(-2);
    month = month < 10 ? '0' + month : month;
    hour = hour < 10 ? '0' + hour : hour;
    minutes = minutes < 10 ? '0' + minutes : minutes;
    dayOfMonth = dayOfMonth < 10 ? '0' + dayOfMonth : dayOfMonth;

    if (diffMs < 0) {
        return `${dayOfMonth}.${month}.'${year} ${hour}:${minutes}`
    }
    if (diffSec < 1) {
        return 'right now';
    } else if (diffMin < 1) {
        return `${diffSec.toFixed()} sec. ago`
    } else if (diffHour < 1) {
        return `${diffMin.toFixed()} min. ago`
    } else {
        return `${dayOfMonth}.${month}.'${year} ${hour}:${minutes}`
    }
}

/* src\components\StudyCard.svelte generated by Svelte v3.5.1 */

const file$e = "src\\components\\StudyCard.svelte";

// (1:0) <script>    import { formatDate }
function create_catch_block(ctx) {
	return {
		c: noop,
		m: noop,
		p: noop,
		d: noop
	};
}

// (178:85)           Variables: {variableCount}
function create_then_block(ctx) {
	var t0, t1_value = ctx.variableCount, t1;

	return {
		c: function create() {
			t0 = text("Variables: ");
			t1 = text(t1_value);
		},

		m: function mount(target, anchor) {
			insert(target, t0, anchor);
			insert(target, t1, anchor);
		},

		p: function update(changed, ctx) {
			if ((changed.$variableStore) && t1_value !== (t1_value = ctx.variableCount)) {
				set_data(t1, t1_value);
			}
		},

		d: function destroy(detaching) {
			if (detaching) {
				detach(t0);
				detach(t1);
			}
		}
	};
}

// (1:0) <script>    import { formatDate }
function create_pending_block(ctx) {
	return {
		c: noop,
		m: noop,
		p: noop,
		d: noop
	};
}

function create_fragment$e(ctx) {
	var div4, div0, svg, path, t0, h4, t1, t2, div1, span0, t3, t4, t5, span1, t6, t7, t8, br, t9, span2, promise, t10, div2, span3, t12, t13_value = formatDate(new ctx.Date(ctx.earliestBeginOfDataGathering)), t13, t14, span4, t16, t17_value = formatDate(ctx.endDate), t17, t18, div3, t19, t20_value = formatDate(ctx.__created), t20, dispose;

	let info = {
		ctx,
		current: null,
		pending: create_pending_block,
		then: create_then_block,
		catch: create_catch_block,
		value: 'variableCount',
		error: 'null'
	};

	handle_promise(promise = ctx.$variableStore.filter(ctx.func).length, info);

	return {
		c: function create() {
			div4 = element("div");
			div0 = element("div");
			svg = svg_element("svg");
			path = svg_element("path");
			t0 = space();
			h4 = element("h4");
			t1 = text(ctx.studyName);
			t2 = space();
			div1 = element("div");
			span0 = element("span");
			t3 = text("Users: ");
			t4 = text(ctx.userCount);
			t5 = space();
			span1 = element("span");
			t6 = text("Responses: ");
			t7 = text(ctx.responses);
			t8 = space();
			br = element("br");
			t9 = space();
			span2 = element("span");

			info.block.c();

			t10 = space();
			div2 = element("div");
			span3 = element("span");
			span3.textContent = "Start:";
			t12 = space();
			t13 = text(t13_value);
			t14 = space();
			span4 = element("span");
			span4.textContent = "End:";
			t16 = space();
			t17 = text(t17_value);
			t18 = space();
			div3 = element("div");
			t19 = text("imported: ");
			t20 = text(t20_value);
			attr(path, "fill", "#777");
			attr(path, "d", "M12,20C7.59,20 4,16.41 4,12C4,7.59 7.59,4 12,4C16.41,4 20,7.59\r\n        20,12C20,16.41 16.41,20 12,20M12,2C6.47,2 2,6.47 2,12C2,17.53 6.47,22\r\n        12,22C17.53,22 22,17.53 22,12C22,6.47 17.53,2\r\n        12,2M14.59,8L12,10.59L9.41,8L8,9.41L10.59,12L8,14.59L9.41,16L12,13.41L14.59,16L16,14.59L13.41,12L16,9.41L14.59,8Z");
			add_location(path, file$e, 163, 6, 3804);
			set_style(svg, "width", "24px");
			set_style(svg, "height", "24px");
			attr(svg, "viewBox", "0 0 24 24");
			add_location(svg, file$e, 162, 4, 3739);
			div0.className = "delete svelte-cjkha5";
			add_location(div0, file$e, 161, 2, 3690);
			h4.className = "svelte-cjkha5";
			add_location(h4, file$e, 171, 2, 4192);
			span0.className = "vars svelte-cjkha5";
			add_location(span0, file$e, 173, 4, 4244);
			span1.className = "vars svelte-cjkha5";
			add_location(span1, file$e, 174, 4, 4315);
			add_location(br, file$e, 175, 4, 4394);
			span2.className = "vars svelte-cjkha5";
			add_location(span2, file$e, 176, 4, 4406);
			div1.className = "mainInfo svelte-cjkha5";
			add_location(div1, file$e, 172, 2, 4216);
			span3.className = "svelte-cjkha5";
			add_location(span3, file$e, 183, 4, 4640);
			span4.className = "svelte-cjkha5";
			add_location(span4, file$e, 185, 4, 4723);
			div2.className = "date svelte-cjkha5";
			add_location(div2, file$e, 182, 2, 4616);
			div3.className = "created svelte-cjkha5";
			add_location(div3, file$e, 188, 2, 4781);
			div4.className = "card svelte-cjkha5";
			add_location(div4, file$e, 160, 0, 3668);

			dispose = [
				listen(div0, "click", ctx.deleteStudy),
				listen(span0, "click", ctx.showUsers),
				listen(span1, "click", ctx.showResponses),
				listen(span2, "click", ctx.showVariables)
			];
		},

		l: function claim(nodes) {
			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
		},

		m: function mount(target, anchor) {
			insert(target, div4, anchor);
			append(div4, div0);
			append(div0, svg);
			append(svg, path);
			append(div4, t0);
			append(div4, h4);
			append(h4, t1);
			append(div4, t2);
			append(div4, div1);
			append(div1, span0);
			append(span0, t3);
			append(span0, t4);
			append(div1, t5);
			append(div1, span1);
			append(span1, t6);
			append(span1, t7);
			append(div1, t8);
			append(div1, br);
			append(div1, t9);
			append(div1, span2);

			info.block.m(span2, info.anchor = null);
			info.mount = () => span2;
			info.anchor = null;

			append(div4, t10);
			append(div4, div2);
			append(div2, span3);
			append(div2, t12);
			append(div2, t13);
			append(div2, t14);
			append(div2, span4);
			append(div2, t16);
			append(div2, t17);
			append(div4, t18);
			append(div4, div3);
			append(div3, t19);
			append(div3, t20);
		},

		p: function update(changed, new_ctx) {
			ctx = new_ctx;
			if (changed.studyName) {
				set_data(t1, ctx.studyName);
			}

			if (changed.userCount) {
				set_data(t4, ctx.userCount);
			}

			if (changed.responses) {
				set_data(t7, ctx.responses);
			}

			info.ctx = ctx;

			if (('$variableStore' in changed) && promise !== (promise = ctx.$variableStore.filter(ctx.func).length) && handle_promise(promise, info)) ; else {
				info.block.p(changed, assign(assign({}, ctx), info.resolved));
			}

			if ((changed.earliestBeginOfDataGathering) && t13_value !== (t13_value = formatDate(new ctx.Date(ctx.earliestBeginOfDataGathering)))) {
				set_data(t13, t13_value);
			}

			if ((changed.__created) && t20_value !== (t20_value = formatDate(ctx.__created))) {
				set_data(t20, t20_value);
			}
		},

		i: noop,
		o: noop,

		d: function destroy(detaching) {
			if (detaching) {
				detach(div4);
			}

			info.block.d();
			info = null;

			run_all(dispose);
		}
	};
}

function instance$b($$self, $$props, $$invalidate) {
	let $variableStore;

	validate_store(variableStore, 'variableStore');
	subscribe($$self, variableStore, $$value => { $variableStore = $$value; $$invalidate('$variableStore', $variableStore); });

	

  let { _id, studyName, description, tasks, __created, minimumStudyDurationPerPerson, maximumStudyDurationPerPerson, earliestBeginOfDataGathering, latestBeginOfDataGathering } = $$props;

  const dispatch = createEventDispatcher();
  function showVariables() {
    dispatch("showVariables", { studyId: _id, studyName });
  }
  function showUsers() {
    dispatch("showUsers", { studyId: _id, studyName });
  }
  function showResponses() {
    dispatch("showResponses", { studyId: _id, studyName });
  }

  let responses = 0;
  let userCount = 0;

  //calc last day of study
  let days =
    Math.max(minimumStudyDurationPerPerson, maximumStudyDurationPerPerson) || 0;
  let endDate = new Date(latestBeginOfDataGathering);
  endDate.setDate(endDate.getDate() + days);

  //FIXME: use stores instead of db
  let res = db
    .transaction("StudyResponses")
    .objectStore("StudyResponses")
    .index("studyId")
    .count(_id);
  res.onsuccess = e => {
    const count = e.target.result;
    $$invalidate('responses', responses = count);
  };
  res = db
    .transaction("Users")
    .objectStore("Users")
    .index("studyId")
    .count(_id);
  res.onsuccess = e => {
    const count = e.target.result;
    $$invalidate('userCount', userCount = count);
  };
  function deleteStudy() {
    if (!confirm("Do you really want to delete this study?")) return;
    const tx = db.transaction(
      [
        "Studies",
        "StudyResponses",
        "StudyTasks",
        "StudyVariables",
        "Users",
        "TaskResults"
      ],
      "readwrite"
    );

    const deleteRows = e => {
      const cursor = e.target.result;
      if (cursor) {
        cursor.delete();
        cursor.continue();
      }
    };

    const deleteByIndex = store => {
      tx
        .objectStore(store)
        .index("studyId")
        .openCursor(_id).onsuccess = deleteRows;
    };

    tx.objectStore("Studies").delete(_id);
    [
      "StudyResponses",
      "StudyTasks",
      "StudyVariables",
      "Users",
      "TaskResults"
    ].forEach(store => {
      deleteByIndex(store);
    });

    // notify stores
    tx.objectStore("Studies").getAll().onsuccess = e =>
      studyStore.set(e.target.result);
    tx.objectStore("StudyVariables").getAll().onsuccess = e =>
      variableStore.set(e.target.result);
  }

	const writable_props = ['_id', 'studyName', 'description', 'tasks', '__created', 'minimumStudyDurationPerPerson', 'maximumStudyDurationPerPerson', 'earliestBeginOfDataGathering', 'latestBeginOfDataGathering'];
	Object.keys($$props).forEach(key => {
		if (!writable_props.includes(key) && !key.startsWith('$$')) console.warn(`<StudyCard> was created with unknown prop '${key}'`);
	});

	function func(v) {
		return v.studyId == _id;
	}

	$$self.$set = $$props => {
		if ('_id' in $$props) $$invalidate('_id', _id = $$props._id);
		if ('studyName' in $$props) $$invalidate('studyName', studyName = $$props.studyName);
		if ('description' in $$props) $$invalidate('description', description = $$props.description);
		if ('tasks' in $$props) $$invalidate('tasks', tasks = $$props.tasks);
		if ('__created' in $$props) $$invalidate('__created', __created = $$props.__created);
		if ('minimumStudyDurationPerPerson' in $$props) $$invalidate('minimumStudyDurationPerPerson', minimumStudyDurationPerPerson = $$props.minimumStudyDurationPerPerson);
		if ('maximumStudyDurationPerPerson' in $$props) $$invalidate('maximumStudyDurationPerPerson', maximumStudyDurationPerPerson = $$props.maximumStudyDurationPerPerson);
		if ('earliestBeginOfDataGathering' in $$props) $$invalidate('earliestBeginOfDataGathering', earliestBeginOfDataGathering = $$props.earliestBeginOfDataGathering);
		if ('latestBeginOfDataGathering' in $$props) $$invalidate('latestBeginOfDataGathering', latestBeginOfDataGathering = $$props.latestBeginOfDataGathering);
	};

	return {
		_id,
		studyName,
		description,
		tasks,
		__created,
		minimumStudyDurationPerPerson,
		maximumStudyDurationPerPerson,
		earliestBeginOfDataGathering,
		latestBeginOfDataGathering,
		showVariables,
		showUsers,
		showResponses,
		responses,
		userCount,
		endDate,
		deleteStudy,
		Date,
		$variableStore,
		func
	};
}

class StudyCard extends SvelteComponentDev {
	constructor(options) {
		super(options);
		init(this, options, instance$b, create_fragment$e, safe_not_equal, ["_id", "studyName", "description", "tasks", "__created", "minimumStudyDurationPerPerson", "maximumStudyDurationPerPerson", "earliestBeginOfDataGathering", "latestBeginOfDataGathering"]);

		const { ctx } = this.$$;
		const props = options.props || {};
		if (ctx._id === undefined && !('_id' in props)) {
			console.warn("<StudyCard> was created without expected prop '_id'");
		}
		if (ctx.studyName === undefined && !('studyName' in props)) {
			console.warn("<StudyCard> was created without expected prop 'studyName'");
		}
		if (ctx.description === undefined && !('description' in props)) {
			console.warn("<StudyCard> was created without expected prop 'description'");
		}
		if (ctx.tasks === undefined && !('tasks' in props)) {
			console.warn("<StudyCard> was created without expected prop 'tasks'");
		}
		if (ctx.__created === undefined && !('__created' in props)) {
			console.warn("<StudyCard> was created without expected prop '__created'");
		}
		if (ctx.minimumStudyDurationPerPerson === undefined && !('minimumStudyDurationPerPerson' in props)) {
			console.warn("<StudyCard> was created without expected prop 'minimumStudyDurationPerPerson'");
		}
		if (ctx.maximumStudyDurationPerPerson === undefined && !('maximumStudyDurationPerPerson' in props)) {
			console.warn("<StudyCard> was created without expected prop 'maximumStudyDurationPerPerson'");
		}
		if (ctx.earliestBeginOfDataGathering === undefined && !('earliestBeginOfDataGathering' in props)) {
			console.warn("<StudyCard> was created without expected prop 'earliestBeginOfDataGathering'");
		}
		if (ctx.latestBeginOfDataGathering === undefined && !('latestBeginOfDataGathering' in props)) {
			console.warn("<StudyCard> was created without expected prop 'latestBeginOfDataGathering'");
		}
	}

	get _id() {
		throw new Error("<StudyCard>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set _id(value) {
		throw new Error("<StudyCard>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get studyName() {
		throw new Error("<StudyCard>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set studyName(value) {
		throw new Error("<StudyCard>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get description() {
		throw new Error("<StudyCard>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set description(value) {
		throw new Error("<StudyCard>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get tasks() {
		throw new Error("<StudyCard>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set tasks(value) {
		throw new Error("<StudyCard>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get __created() {
		throw new Error("<StudyCard>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set __created(value) {
		throw new Error("<StudyCard>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get minimumStudyDurationPerPerson() {
		throw new Error("<StudyCard>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set minimumStudyDurationPerPerson(value) {
		throw new Error("<StudyCard>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get maximumStudyDurationPerPerson() {
		throw new Error("<StudyCard>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set maximumStudyDurationPerPerson(value) {
		throw new Error("<StudyCard>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get earliestBeginOfDataGathering() {
		throw new Error("<StudyCard>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set earliestBeginOfDataGathering(value) {
		throw new Error("<StudyCard>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get latestBeginOfDataGathering() {
		throw new Error("<StudyCard>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set latestBeginOfDataGathering(value) {
		throw new Error("<StudyCard>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}
}

/* src\components\StudyVariables.svelte generated by Svelte v3.5.1 */

const file$f = "src\\components\\StudyVariables.svelte";

function get_each_context$1(ctx, list, i) {
	const child_ctx = Object.create(ctx);
	child_ctx.v = list[i];
	return child_ctx;
}

// (49:4) {#each $variableStore.filter(v => v.studyId == studyId) as v}
function create_each_block$1(ctx) {
	var tr, td0, t0_value = ctx.v.variableName, t0, t1, td1, t2_value = ctx.v.variableLabel, t2, t3, td2, t4_value = ucFirst(ctx.v.measure), t4, t5;

	return {
		c: function create() {
			tr = element("tr");
			td0 = element("td");
			t0 = text(t0_value);
			t1 = space();
			td1 = element("td");
			t2 = text(t2_value);
			t3 = space();
			td2 = element("td");
			t4 = text(t4_value);
			t5 = space();
			td0.className = "name svelte-vhmrc0";
			add_location(td0, file$f, 50, 8, 981);
			td1.className = "label svelte-vhmrc0";
			add_location(td1, file$f, 51, 8, 1029);
			td2.className = "measure svelte-vhmrc0";
			add_location(td2, file$f, 52, 8, 1079);
			tr.className = "svelte-vhmrc0";
			add_location(tr, file$f, 49, 6, 967);
		},

		m: function mount(target, anchor) {
			insert(target, tr, anchor);
			append(tr, td0);
			append(td0, t0);
			append(tr, t1);
			append(tr, td1);
			append(td1, t2);
			append(tr, t3);
			append(tr, td2);
			append(td2, t4);
			append(tr, t5);
		},

		p: function update(changed, ctx) {
			if ((changed.$variableStore) && t0_value !== (t0_value = ctx.v.variableName)) {
				set_data(t0, t0_value);
			}

			if ((changed.$variableStore) && t2_value !== (t2_value = ctx.v.variableLabel)) {
				set_data(t2, t2_value);
			}

			if ((changed.$variableStore) && t4_value !== (t4_value = ucFirst(ctx.v.measure))) {
				set_data(t4, t4_value);
			}
		},

		d: function destroy(detaching) {
			if (detaching) {
				detach(tr);
			}
		}
	};
}

function create_fragment$f(ctx) {
	var div, p, t0, strong, t1, t2, table, tr, th0, t4, th1, t6, th2, t8;

	var each_value = ctx.$variableStore.filter(ctx.func);

	var each_blocks = [];

	for (var i = 0; i < each_value.length; i += 1) {
		each_blocks[i] = create_each_block$1(get_each_context$1(ctx, each_value, i));
	}

	return {
		c: function create() {
			div = element("div");
			p = element("p");
			t0 = text("Variables of\r\n    ");
			strong = element("strong");
			t1 = text(ctx.studyName);
			t2 = space();
			table = element("table");
			tr = element("tr");
			th0 = element("th");
			th0.textContent = "Name";
			t4 = space();
			th1 = element("th");
			th1.textContent = "Label";
			t6 = space();
			th2 = element("th");
			th2.textContent = "Measure";
			t8 = space();

			for (var i = 0; i < each_blocks.length; i += 1) {
				each_blocks[i].c();
			}
			add_location(strong, file$f, 40, 4, 757);
			add_location(p, file$f, 38, 2, 730);
			th0.className = "svelte-vhmrc0";
			add_location(th0, file$f, 44, 6, 822);
			th1.className = "svelte-vhmrc0";
			add_location(th1, file$f, 45, 6, 843);
			th2.className = "svelte-vhmrc0";
			add_location(th2, file$f, 46, 6, 865);
			tr.className = "svelte-vhmrc0";
			add_location(tr, file$f, 43, 4, 810);
			table.className = "svelte-vhmrc0";
			add_location(table, file$f, 42, 2, 797);
			div.className = "container svelte-vhmrc0";
			add_location(div, file$f, 37, 0, 703);
		},

		l: function claim(nodes) {
			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
		},

		m: function mount(target, anchor) {
			insert(target, div, anchor);
			append(div, p);
			append(p, t0);
			append(p, strong);
			append(strong, t1);
			append(div, t2);
			append(div, table);
			append(table, tr);
			append(tr, th0);
			append(tr, t4);
			append(tr, th1);
			append(tr, t6);
			append(tr, th2);
			append(table, t8);

			for (var i = 0; i < each_blocks.length; i += 1) {
				each_blocks[i].m(table, null);
			}
		},

		p: function update(changed, ctx) {
			if (changed.studyName) {
				set_data(t1, ctx.studyName);
			}

			if (changed.ucFirst || changed.$variableStore) {
				each_value = ctx.$variableStore.filter(ctx.func);

				for (var i = 0; i < each_value.length; i += 1) {
					const child_ctx = get_each_context$1(ctx, each_value, i);

					if (each_blocks[i]) {
						each_blocks[i].p(changed, child_ctx);
					} else {
						each_blocks[i] = create_each_block$1(child_ctx);
						each_blocks[i].c();
						each_blocks[i].m(table, null);
					}
				}

				for (; i < each_blocks.length; i += 1) {
					each_blocks[i].d(1);
				}
				each_blocks.length = each_value.length;
			}
		},

		i: noop,
		o: noop,

		d: function destroy(detaching) {
			if (detaching) {
				detach(div);
			}

			destroy_each(each_blocks, detaching);
		}
	};
}

function ucFirst(string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
}

function instance$c($$self, $$props, $$invalidate) {
	let $variableStore;

	validate_store(variableStore, 'variableStore');
	subscribe($$self, variableStore, $$value => { $variableStore = $$value; $$invalidate('$variableStore', $variableStore); });

	
  let { studyId = 0, studyName = "" } = $$props;

	const writable_props = ['studyId', 'studyName'];
	Object.keys($$props).forEach(key => {
		if (!writable_props.includes(key) && !key.startsWith('$$')) console.warn(`<StudyVariables> was created with unknown prop '${key}'`);
	});

	function func(v) {
		return v.studyId == studyId;
	}

	$$self.$set = $$props => {
		if ('studyId' in $$props) $$invalidate('studyId', studyId = $$props.studyId);
		if ('studyName' in $$props) $$invalidate('studyName', studyName = $$props.studyName);
	};

	return { studyId, studyName, $variableStore, func };
}

class StudyVariables extends SvelteComponentDev {
	constructor(options) {
		super(options);
		init(this, options, instance$c, create_fragment$f, safe_not_equal, ["studyId", "studyName"]);
	}

	get studyId() {
		throw new Error("<StudyVariables>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set studyId(value) {
		throw new Error("<StudyVariables>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get studyName() {
		throw new Error("<StudyVariables>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set studyName(value) {
		throw new Error("<StudyVariables>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}
}

/* src\components\StudyUsers.svelte generated by Svelte v3.5.1 */

const file$g = "src\\components\\StudyUsers.svelte";

function get_each_context_1(ctx, list, i) {
	const child_ctx = Object.create(ctx);
	child_ctx.demo = list[i];
	return child_ctx;
}

function get_each_context$2(ctx, list, i) {
	const child_ctx = Object.create(ctx);
	child_ctx.data = list[i];
	return child_ctx;
}

// (74:12) {#each data[1].demographics as demo}
function create_each_block_1(ctx) {
	var tr, td0, t0_value = ctx.demo.variableName, t0, t1, t2, td1, t3_value = ctx.demo.value, t3;

	return {
		c: function create() {
			tr = element("tr");
			td0 = element("td");
			t0 = text(t0_value);
			t1 = text(":");
			t2 = space();
			td1 = element("td");
			t3 = text(t3_value);
			td0.className = "svelte-vhmrc0";
			add_location(td0, file$g, 75, 16, 1612);
			td1.className = "svelte-vhmrc0";
			add_location(td1, file$g, 76, 16, 1659);
			tr.className = "svelte-vhmrc0";
			add_location(tr, file$g, 74, 14, 1590);
		},

		m: function mount(target, anchor) {
			insert(target, tr, anchor);
			append(tr, td0);
			append(td0, t0);
			append(td0, t1);
			append(tr, t2);
			append(tr, td1);
			append(td1, t3);
		},

		p: function update(changed, ctx) {
			if ((changed.users) && t0_value !== (t0_value = ctx.demo.variableName)) {
				set_data(t0, t0_value);
			}

			if ((changed.users) && t3_value !== (t3_value = ctx.demo.value)) {
				set_data(t3, t3_value);
			}
		},

		d: function destroy(detaching) {
			if (detaching) {
				detach(tr);
			}
		}
	};
}

// (69:4) {#each users as data}
function create_each_block$2(ctx) {
	var tr, td0, t0_value = ctx.data[0], t0, t1, td1, table, t2;

	var each_value_1 = ctx.data[1].demographics;

	var each_blocks = [];

	for (var i = 0; i < each_value_1.length; i += 1) {
		each_blocks[i] = create_each_block_1(get_each_context_1(ctx, each_value_1, i));
	}

	return {
		c: function create() {
			tr = element("tr");
			td0 = element("td");
			t0 = text(t0_value);
			t1 = space();
			td1 = element("td");
			table = element("table");

			for (var i = 0; i < each_blocks.length; i += 1) {
				each_blocks[i].c();
			}

			t2 = space();
			td0.className = "svelte-vhmrc0";
			add_location(td0, file$g, 70, 8, 1471);
			table.className = "svelte-vhmrc0";
			add_location(table, file$g, 72, 10, 1517);
			td1.className = "svelte-vhmrc0";
			add_location(td1, file$g, 71, 8, 1501);
			tr.className = "svelte-vhmrc0";
			add_location(tr, file$g, 69, 6, 1457);
		},

		m: function mount(target, anchor) {
			insert(target, tr, anchor);
			append(tr, td0);
			append(td0, t0);
			append(tr, t1);
			append(tr, td1);
			append(td1, table);

			for (var i = 0; i < each_blocks.length; i += 1) {
				each_blocks[i].m(table, null);
			}

			append(tr, t2);
		},

		p: function update(changed, ctx) {
			if ((changed.users) && t0_value !== (t0_value = ctx.data[0])) {
				set_data(t0, t0_value);
			}

			if (changed.users) {
				each_value_1 = ctx.data[1].demographics;

				for (var i = 0; i < each_value_1.length; i += 1) {
					const child_ctx = get_each_context_1(ctx, each_value_1, i);

					if (each_blocks[i]) {
						each_blocks[i].p(changed, child_ctx);
					} else {
						each_blocks[i] = create_each_block_1(child_ctx);
						each_blocks[i].c();
						each_blocks[i].m(table, null);
					}
				}

				for (; i < each_blocks.length; i += 1) {
					each_blocks[i].d(1);
				}
				each_blocks.length = each_value_1.length;
			}
		},

		d: function destroy(detaching) {
			if (detaching) {
				detach(tr);
			}

			destroy_each(each_blocks, detaching);
		}
	};
}

function create_fragment$g(ctx) {
	var div, p, t0, strong, t1, t2, table, tr, th0, t4, th1, t6;

	var each_value = ctx.users;

	var each_blocks = [];

	for (var i = 0; i < each_value.length; i += 1) {
		each_blocks[i] = create_each_block$2(get_each_context$2(ctx, each_value, i));
	}

	return {
		c: function create() {
			div = element("div");
			p = element("p");
			t0 = text("Users of\r\n    ");
			strong = element("strong");
			t1 = text(ctx.studyName);
			t2 = space();
			table = element("table");
			tr = element("tr");
			th0 = element("th");
			th0.textContent = "User Id";
			t4 = space();
			th1 = element("th");
			th1.textContent = "Demographics";
			t6 = space();

			for (var i = 0; i < each_blocks.length; i += 1) {
				each_blocks[i].c();
			}
			add_location(strong, file$g, 61, 4, 1301);
			add_location(p, file$g, 59, 2, 1278);
			th0.className = "svelte-vhmrc0";
			add_location(th0, file$g, 65, 6, 1366);
			th1.className = "svelte-vhmrc0";
			add_location(th1, file$g, 66, 6, 1390);
			tr.className = "svelte-vhmrc0";
			add_location(tr, file$g, 64, 4, 1354);
			table.className = "svelte-vhmrc0";
			add_location(table, file$g, 63, 2, 1341);
			div.className = "container svelte-vhmrc0";
			add_location(div, file$g, 58, 0, 1251);
		},

		l: function claim(nodes) {
			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
		},

		m: function mount(target, anchor) {
			insert(target, div, anchor);
			append(div, p);
			append(p, t0);
			append(p, strong);
			append(strong, t1);
			append(div, t2);
			append(div, table);
			append(table, tr);
			append(tr, th0);
			append(tr, t4);
			append(tr, th1);
			append(table, t6);

			for (var i = 0; i < each_blocks.length; i += 1) {
				each_blocks[i].m(table, null);
			}
		},

		p: function update(changed, ctx) {
			if (changed.studyName) {
				set_data(t1, ctx.studyName);
			}

			if (changed.users) {
				each_value = ctx.users;

				for (var i = 0; i < each_value.length; i += 1) {
					const child_ctx = get_each_context$2(ctx, each_value, i);

					if (each_blocks[i]) {
						each_blocks[i].p(changed, child_ctx);
					} else {
						each_blocks[i] = create_each_block$2(child_ctx);
						each_blocks[i].c();
						each_blocks[i].m(table, null);
					}
				}

				for (; i < each_blocks.length; i += 1) {
					each_blocks[i].d(1);
				}
				each_blocks.length = each_value.length;
			}
		},

		i: noop,
		o: noop,

		d: function destroy(detaching) {
			if (detaching) {
				detach(div);
			}

			destroy_each(each_blocks, detaching);
		}
	};
}

function instance$d($$self, $$props, $$invalidate) {
	let { studyId = 0, studyName = "" } = $$props;
  let users = [];
  const userMap = new Map();
  if (studyId) {
    const tx = db.transaction(["Users", "Demographics"]);
    const res = tx
      .objectStore("Users")
      .index("studyId")
      .getAll(studyId);
    res.onsuccess = e => {
      const studyUsers = e.target.result;
      for (const userData of studyUsers) {
        const userId = userData.userId;

        const res = tx
          .objectStore("Demographics")
          .index("userId")
          .getAll(userId);
        res.onsuccess = e => {
          const demographics = e.target.result;
          userMap.set(userId, { demographics });
          $$invalidate('users', users = [...userMap]);
        };
      }
    };
  }

	const writable_props = ['studyId', 'studyName'];
	Object.keys($$props).forEach(key => {
		if (!writable_props.includes(key) && !key.startsWith('$$')) console.warn(`<StudyUsers> was created with unknown prop '${key}'`);
	});

	$$self.$set = $$props => {
		if ('studyId' in $$props) $$invalidate('studyId', studyId = $$props.studyId);
		if ('studyName' in $$props) $$invalidate('studyName', studyName = $$props.studyName);
	};

	return { studyId, studyName, users };
}

class StudyUsers extends SvelteComponentDev {
	constructor(options) {
		super(options);
		init(this, options, instance$d, create_fragment$g, safe_not_equal, ["studyId", "studyName"]);
	}

	get studyId() {
		throw new Error("<StudyUsers>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set studyId(value) {
		throw new Error("<StudyUsers>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get studyName() {
		throw new Error("<StudyUsers>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set studyName(value) {
		throw new Error("<StudyUsers>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}
}

/* src\components\StudyResponses.svelte generated by Svelte v3.5.1 */

const file$h = "src\\components\\StudyResponses.svelte";

function get_each_context_2(ctx, list, i) {
	const child_ctx = Object.create(ctx);
	child_ctx.item = list[i];
	return child_ctx;
}

function get_each_context_1$1(ctx, list, i) {
	const child_ctx = Object.create(ctx);
	child_ctx.steps = list[i];
	return child_ctx;
}

function get_each_context$3(ctx, list, i) {
	const child_ctx = Object.create(ctx);
	child_ctx.response = list[i];
	return child_ctx;
}

// (73:14) {#each steps.stepItemResults as item}
function create_each_block_2(ctx) {
	var tr, td0, t0_value = ctx.item.variableName, t0, t1, t2, td1, t3_value = ctx.item.value, t3;

	return {
		c: function create() {
			tr = element("tr");
			td0 = element("td");
			t0 = text(t0_value);
			t1 = text(":");
			t2 = space();
			td1 = element("td");
			t3 = text(t3_value);
			set_style(td0, "width", "65%");
			td0.className = "svelte-vhmrc0";
			add_location(td0, file$h, 74, 18, 1688);
			td1.className = "svelte-vhmrc0";
			add_location(td1, file$h, 75, 18, 1755);
			tr.className = "svelte-vhmrc0";
			add_location(tr, file$h, 73, 16, 1664);
		},

		m: function mount(target, anchor) {
			insert(target, tr, anchor);
			append(tr, td0);
			append(td0, t0);
			append(td0, t1);
			append(tr, t2);
			append(tr, td1);
			append(td1, t3);
		},

		p: function update(changed, ctx) {
			if ((changed.responses) && t0_value !== (t0_value = ctx.item.variableName)) {
				set_data(t0, t0_value);
			}

			if ((changed.responses) && t3_value !== (t3_value = ctx.item.value)) {
				set_data(t3, t3_value);
			}
		},

		d: function destroy(detaching) {
			if (detaching) {
				detach(tr);
			}
		}
	};
}

// (72:12) {#each response.stepResults as steps}
function create_each_block_1$1(ctx) {
	var each_1_anchor;

	var each_value_2 = ctx.steps.stepItemResults;

	var each_blocks = [];

	for (var i = 0; i < each_value_2.length; i += 1) {
		each_blocks[i] = create_each_block_2(get_each_context_2(ctx, each_value_2, i));
	}

	return {
		c: function create() {
			for (var i = 0; i < each_blocks.length; i += 1) {
				each_blocks[i].c();
			}

			each_1_anchor = empty();
		},

		m: function mount(target, anchor) {
			for (var i = 0; i < each_blocks.length; i += 1) {
				each_blocks[i].m(target, anchor);
			}

			insert(target, each_1_anchor, anchor);
		},

		p: function update(changed, ctx) {
			if (changed.responses) {
				each_value_2 = ctx.steps.stepItemResults;

				for (var i = 0; i < each_value_2.length; i += 1) {
					const child_ctx = get_each_context_2(ctx, each_value_2, i);

					if (each_blocks[i]) {
						each_blocks[i].p(changed, child_ctx);
					} else {
						each_blocks[i] = create_each_block_2(child_ctx);
						each_blocks[i].c();
						each_blocks[i].m(each_1_anchor.parentNode, each_1_anchor);
					}
				}

				for (; i < each_blocks.length; i += 1) {
					each_blocks[i].d(1);
				}
				each_blocks.length = each_value_2.length;
			}
		},

		d: function destroy(detaching) {
			destroy_each(each_blocks, detaching);

			if (detaching) {
				detach(each_1_anchor);
			}
		}
	};
}

// (61:4) {#each responses as response}
function create_each_block$3(ctx) {
	var tr, td0, t0_value = ctx.response.userId, t0, t1, td1, t2_value = ctx.response.taskName, t2, t3, td2, t4, t5_value = formatDate(new Date(ctx.response.startDate)), t5, t6, br, t7, t8_value = formatDate(new Date(ctx.response.endDate)), t8, t9, td3, table, t10;

	var each_value_1 = ctx.response.stepResults;

	var each_blocks = [];

	for (var i = 0; i < each_value_1.length; i += 1) {
		each_blocks[i] = create_each_block_1$1(get_each_context_1$1(ctx, each_value_1, i));
	}

	return {
		c: function create() {
			tr = element("tr");
			td0 = element("td");
			t0 = text(t0_value);
			t1 = space();
			td1 = element("td");
			t2 = text(t2_value);
			t3 = space();
			td2 = element("td");
			t4 = text("Start: ");
			t5 = text(t5_value);
			t6 = space();
			br = element("br");
			t7 = text("\r\n           End: ");
			t8 = text(t8_value);
			t9 = space();
			td3 = element("td");
			table = element("table");

			for (var i = 0; i < each_blocks.length; i += 1) {
				each_blocks[i].c();
			}

			t10 = space();
			td0.className = "svelte-vhmrc0";
			add_location(td0, file$h, 62, 8, 1249);
			td1.className = "svelte-vhmrc0";
			add_location(td1, file$h, 63, 8, 1287);
			add_location(br, file$h, 66, 10, 1411);
			attr(td2, "nowrap", "");
			td2.className = "svelte-vhmrc0";
			add_location(td2, file$h, 64, 8, 1327);
			set_style(table, "width", "100%");
			table.className = "svelte-vhmrc0";
			add_location(table, file$h, 70, 10, 1516);
			td3.className = "svelte-vhmrc0";
			add_location(td3, file$h, 69, 8, 1500);
			tr.className = "svelte-vhmrc0";
			add_location(tr, file$h, 61, 6, 1235);
		},

		m: function mount(target, anchor) {
			insert(target, tr, anchor);
			append(tr, td0);
			append(td0, t0);
			append(tr, t1);
			append(tr, td1);
			append(td1, t2);
			append(tr, t3);
			append(tr, td2);
			append(td2, t4);
			append(td2, t5);
			append(td2, t6);
			append(td2, br);
			append(td2, t7);
			append(td2, t8);
			append(tr, t9);
			append(tr, td3);
			append(td3, table);

			for (var i = 0; i < each_blocks.length; i += 1) {
				each_blocks[i].m(table, null);
			}

			append(tr, t10);
		},

		p: function update(changed, ctx) {
			if ((changed.responses) && t0_value !== (t0_value = ctx.response.userId)) {
				set_data(t0, t0_value);
			}

			if ((changed.responses) && t2_value !== (t2_value = ctx.response.taskName)) {
				set_data(t2, t2_value);
			}

			if ((changed.responses) && t5_value !== (t5_value = formatDate(new Date(ctx.response.startDate)))) {
				set_data(t5, t5_value);
			}

			if ((changed.responses) && t8_value !== (t8_value = formatDate(new Date(ctx.response.endDate)))) {
				set_data(t8, t8_value);
			}

			if (changed.responses) {
				each_value_1 = ctx.response.stepResults;

				for (var i = 0; i < each_value_1.length; i += 1) {
					const child_ctx = get_each_context_1$1(ctx, each_value_1, i);

					if (each_blocks[i]) {
						each_blocks[i].p(changed, child_ctx);
					} else {
						each_blocks[i] = create_each_block_1$1(child_ctx);
						each_blocks[i].c();
						each_blocks[i].m(table, null);
					}
				}

				for (; i < each_blocks.length; i += 1) {
					each_blocks[i].d(1);
				}
				each_blocks.length = each_value_1.length;
			}
		},

		d: function destroy(detaching) {
			if (detaching) {
				detach(tr);
			}

			destroy_each(each_blocks, detaching);
		}
	};
}

function create_fragment$h(ctx) {
	var div, p, t0, strong, t1, t2, table, tr, th0, t4, th1, t6, th2, t8, th3, t10;

	var each_value = ctx.responses;

	var each_blocks = [];

	for (var i = 0; i < each_value.length; i += 1) {
		each_blocks[i] = create_each_block$3(get_each_context$3(ctx, each_value, i));
	}

	return {
		c: function create() {
			div = element("div");
			p = element("p");
			t0 = text("Responses of\r\n    ");
			strong = element("strong");
			t1 = text(ctx.studyName);
			t2 = space();
			table = element("table");
			tr = element("tr");
			th0 = element("th");
			th0.textContent = "User Id";
			t4 = space();
			th1 = element("th");
			th1.textContent = "Task";
			t6 = space();
			th2 = element("th");
			th2.textContent = "Date";
			t8 = space();
			th3 = element("th");
			th3.textContent = "Results";
			t10 = space();

			for (var i = 0; i < each_blocks.length; i += 1) {
				each_blocks[i].c();
			}
			add_location(strong, file$h, 51, 4, 1034);
			add_location(p, file$h, 49, 2, 1007);
			th0.className = "svelte-vhmrc0";
			add_location(th0, file$h, 55, 6, 1099);
			th1.className = "svelte-vhmrc0";
			add_location(th1, file$h, 56, 6, 1123);
			th2.className = "svelte-vhmrc0";
			add_location(th2, file$h, 57, 6, 1144);
			th3.className = "svelte-vhmrc0";
			add_location(th3, file$h, 58, 6, 1165);
			tr.className = "svelte-vhmrc0";
			add_location(tr, file$h, 54, 4, 1087);
			table.className = "svelte-vhmrc0";
			add_location(table, file$h, 53, 2, 1074);
			div.className = "container svelte-vhmrc0";
			add_location(div, file$h, 48, 0, 980);
		},

		l: function claim(nodes) {
			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
		},

		m: function mount(target, anchor) {
			insert(target, div, anchor);
			append(div, p);
			append(p, t0);
			append(p, strong);
			append(strong, t1);
			append(div, t2);
			append(div, table);
			append(table, tr);
			append(tr, th0);
			append(tr, t4);
			append(tr, th1);
			append(tr, t6);
			append(tr, th2);
			append(tr, t8);
			append(tr, th3);
			append(table, t10);

			for (var i = 0; i < each_blocks.length; i += 1) {
				each_blocks[i].m(table, null);
			}
		},

		p: function update(changed, ctx) {
			if (changed.studyName) {
				set_data(t1, ctx.studyName);
			}

			if (changed.responses || changed.formatDate) {
				each_value = ctx.responses;

				for (var i = 0; i < each_value.length; i += 1) {
					const child_ctx = get_each_context$3(ctx, each_value, i);

					if (each_blocks[i]) {
						each_blocks[i].p(changed, child_ctx);
					} else {
						each_blocks[i] = create_each_block$3(child_ctx);
						each_blocks[i].c();
						each_blocks[i].m(table, null);
					}
				}

				for (; i < each_blocks.length; i += 1) {
					each_blocks[i].d(1);
				}
				each_blocks.length = each_value.length;
			}
		},

		i: noop,
		o: noop,

		d: function destroy(detaching) {
			if (detaching) {
				detach(div);
			}

			destroy_each(each_blocks, detaching);
		}
	};
}

function instance$e($$self, $$props, $$invalidate) {
	

  let { studyId = 0, studyName = "" } = $$props;
  let responses = [];
  if (studyId) {
    const res = db
      .transaction("StudyResponses")
      .objectStore("StudyResponses")
      .index("studyId")
      .getAll(studyId);
    res.onsuccess = e => {
      const userResponses = e.target.result;
      for (const response of userResponses) {
        $$invalidate('responses', responses = [...responses, response]);
      }
    };
  }

	const writable_props = ['studyId', 'studyName'];
	Object.keys($$props).forEach(key => {
		if (!writable_props.includes(key) && !key.startsWith('$$')) console.warn(`<StudyResponses> was created with unknown prop '${key}'`);
	});

	$$self.$set = $$props => {
		if ('studyId' in $$props) $$invalidate('studyId', studyId = $$props.studyId);
		if ('studyName' in $$props) $$invalidate('studyName', studyName = $$props.studyName);
	};

	return { studyId, studyName, responses };
}

class StudyResponses extends SvelteComponentDev {
	constructor(options) {
		super(options);
		init(this, options, instance$e, create_fragment$h, safe_not_equal, ["studyId", "studyName"]);
	}

	get studyId() {
		throw new Error("<StudyResponses>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set studyId(value) {
		throw new Error("<StudyResponses>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get studyName() {
		throw new Error("<StudyResponses>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set studyName(value) {
		throw new Error("<StudyResponses>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}
}

/* src\pages\StudyList.svelte generated by Svelte v3.5.1 */

const file$i = "src\\pages\\StudyList.svelte";

function get_each_context$4(ctx, list, i) {
	const child_ctx = Object.create(ctx);
	child_ctx.study = list[i];
	return child_ctx;
}

// (90:0) {#if toggleVars}
function create_if_block_2(ctx) {
	var div1, t, div0, div1_transition, current, dispose;

	var studyvariables_spread_levels = [
		ctx.studyData
	];

	let studyvariables_props = {};
	for (var i = 0; i < studyvariables_spread_levels.length; i += 1) {
		studyvariables_props = assign(studyvariables_props, studyvariables_spread_levels[i]);
	}
	var studyvariables = new StudyVariables({
		props: studyvariables_props,
		$$inline: true
	});

	return {
		c: function create() {
			div1 = element("div");
			studyvariables.$$.fragment.c();
			t = space();
			div0 = element("div");
			div0.textContent = "x close";
			div0.className = "close svelte-1ddmxdo";
			add_location(div0, file$i, 92, 4, 2337);
			div1.className = "varInfo svelte-1ddmxdo";
			add_location(div1, file$i, 90, 2, 2227);
			dispose = listen(div0, "click", ctx.click_handler);
		},

		m: function mount(target, anchor) {
			insert(target, div1, anchor);
			mount_component(studyvariables, div1, null);
			append(div1, t);
			append(div1, div0);
			current = true;
		},

		p: function update(changed, ctx) {
			var studyvariables_changes = changed.studyData ? get_spread_update(studyvariables_spread_levels, [
				ctx.studyData
			]) : {};
			studyvariables.$set(studyvariables_changes);
		},

		i: function intro(local) {
			if (current) return;
			studyvariables.$$.fragment.i(local);

			add_render_callback(() => {
				if (!div1_transition) div1_transition = create_bidirectional_transition(div1, fly, { x: -200, duration: 200 }, true);
				div1_transition.run(1);
			});

			current = true;
		},

		o: function outro(local) {
			studyvariables.$$.fragment.o(local);

			if (!div1_transition) div1_transition = create_bidirectional_transition(div1, fly, { x: -200, duration: 200 }, false);
			div1_transition.run(0);

			current = false;
		},

		d: function destroy(detaching) {
			if (detaching) {
				detach(div1);
			}

			studyvariables.$destroy();

			if (detaching) {
				if (div1_transition) div1_transition.end();
			}

			dispose();
		}
	};
}

// (97:0) {#if toggleUsers}
function create_if_block_1$1(ctx) {
	var div1, t, div0, div1_transition, current, dispose;

	var studyusers_spread_levels = [
		ctx.studyData
	];

	let studyusers_props = {};
	for (var i = 0; i < studyusers_spread_levels.length; i += 1) {
		studyusers_props = assign(studyusers_props, studyusers_spread_levels[i]);
	}
	var studyusers = new StudyUsers({ props: studyusers_props, $$inline: true });

	return {
		c: function create() {
			div1 = element("div");
			studyusers.$$.fragment.c();
			t = space();
			div0 = element("div");
			div0.textContent = "x close";
			div0.className = "close svelte-1ddmxdo";
			add_location(div0, file$i, 99, 4, 2555);
			div1.className = "varInfo svelte-1ddmxdo";
			add_location(div1, file$i, 97, 2, 2449);
			dispose = listen(div0, "click", ctx.click_handler_1);
		},

		m: function mount(target, anchor) {
			insert(target, div1, anchor);
			mount_component(studyusers, div1, null);
			append(div1, t);
			append(div1, div0);
			current = true;
		},

		p: function update(changed, ctx) {
			var studyusers_changes = changed.studyData ? get_spread_update(studyusers_spread_levels, [
				ctx.studyData
			]) : {};
			studyusers.$set(studyusers_changes);
		},

		i: function intro(local) {
			if (current) return;
			studyusers.$$.fragment.i(local);

			add_render_callback(() => {
				if (!div1_transition) div1_transition = create_bidirectional_transition(div1, fly, { x: -200, duration: 200 }, true);
				div1_transition.run(1);
			});

			current = true;
		},

		o: function outro(local) {
			studyusers.$$.fragment.o(local);

			if (!div1_transition) div1_transition = create_bidirectional_transition(div1, fly, { x: -200, duration: 200 }, false);
			div1_transition.run(0);

			current = false;
		},

		d: function destroy(detaching) {
			if (detaching) {
				detach(div1);
			}

			studyusers.$destroy();

			if (detaching) {
				if (div1_transition) div1_transition.end();
			}

			dispose();
		}
	};
}

// (104:0) {#if toggleResponses}
function create_if_block$3(ctx) {
	var div1, t, div0, div1_transition, current, dispose;

	var studyresponses_spread_levels = [
		ctx.studyData
	];

	let studyresponses_props = {};
	for (var i = 0; i < studyresponses_spread_levels.length; i += 1) {
		studyresponses_props = assign(studyresponses_props, studyresponses_spread_levels[i]);
	}
	var studyresponses = new StudyResponses({
		props: studyresponses_props,
		$$inline: true
	});

	return {
		c: function create() {
			div1 = element("div");
			studyresponses.$$.fragment.c();
			t = space();
			div0 = element("div");
			div0.textContent = "x close";
			div0.className = "close svelte-1ddmxdo";
			add_location(div0, file$i, 106, 4, 2782);
			div1.className = "varInfo svelte-1ddmxdo";
			add_location(div1, file$i, 104, 2, 2672);
			dispose = listen(div0, "click", ctx.click_handler_2);
		},

		m: function mount(target, anchor) {
			insert(target, div1, anchor);
			mount_component(studyresponses, div1, null);
			append(div1, t);
			append(div1, div0);
			current = true;
		},

		p: function update(changed, ctx) {
			var studyresponses_changes = changed.studyData ? get_spread_update(studyresponses_spread_levels, [
				ctx.studyData
			]) : {};
			studyresponses.$set(studyresponses_changes);
		},

		i: function intro(local) {
			if (current) return;
			studyresponses.$$.fragment.i(local);

			add_render_callback(() => {
				if (!div1_transition) div1_transition = create_bidirectional_transition(div1, fly, { x: -200, duration: 200 }, true);
				div1_transition.run(1);
			});

			current = true;
		},

		o: function outro(local) {
			studyresponses.$$.fragment.o(local);

			if (!div1_transition) div1_transition = create_bidirectional_transition(div1, fly, { x: -200, duration: 200 }, false);
			div1_transition.run(0);

			current = false;
		},

		d: function destroy(detaching) {
			if (detaching) {
				detach(div1);
			}

			studyresponses.$destroy();

			if (detaching) {
				if (div1_transition) div1_transition.end();
			}

			dispose();
		}
	};
}

// (112:2) {#each $studyStore as study (study._id)}
function create_each_block$4(key_1, ctx) {
	var div, div_intro, rect, stop_animation = noop, current;

	var studycard_spread_levels = [
		ctx.study
	];

	let studycard_props = {};
	for (var i = 0; i < studycard_spread_levels.length; i += 1) {
		studycard_props = assign(studycard_props, studycard_spread_levels[i]);
	}
	var studycard = new StudyCard({ props: studycard_props, $$inline: true });
	studycard.$on("showVariables", ctx.showVars);
	studycard.$on("showResponses", ctx.showResponses);
	studycard.$on("showUsers", ctx.showUsers);

	return {
		key: key_1,

		first: null,

		c: function create() {
			div = element("div");
			studycard.$$.fragment.c();
			div.className = "study svelte-1ddmxdo";
			add_location(div, file$i, 112, 4, 2979);
			this.first = div;
		},

		m: function mount(target, anchor) {
			insert(target, div, anchor);
			mount_component(studycard, div, null);
			current = true;
		},

		p: function update(changed, ctx) {
			var studycard_changes = changed.$studyStore ? get_spread_update(studycard_spread_levels, [
				ctx.study
			]) : {};
			studycard.$set(studycard_changes);
		},

		r: function measure_1() {
			rect = div.getBoundingClientRect();
		},

		f: function fix() {
			fix_position(div);
			stop_animation();
		},

		a: function animate() {
			stop_animation();
			stop_animation = create_animation(div, rect, flip, { duration: 300 });
		},

		i: function intro(local) {
			if (current) return;
			studycard.$$.fragment.i(local);

			if (!div_intro) {
				add_render_callback(() => {
					div_intro = create_in_transition(div, fly, { duration: 300, y: -100 });
					div_intro.start();
				});
			}

			current = true;
		},

		o: function outro(local) {
			studycard.$$.fragment.o(local);
			current = false;
		},

		d: function destroy(detaching) {
			if (detaching) {
				detach(div);
			}

			studycard.$destroy();
		}
	};
}

function create_fragment$i(ctx) {
	var t0, t1, t2, div1, each_blocks = [], each_1_lookup = new Map(), t3, div0, div1_intro, t4, div2, current, dispose;

	var if_block0 = (ctx.toggleVars) && create_if_block_2(ctx);

	var if_block1 = (ctx.toggleUsers) && create_if_block_1$1(ctx);

	var if_block2 = (ctx.toggleResponses) && create_if_block$3(ctx);

	var each_value = ctx.$studyStore;

	const get_key = ctx => ctx.study._id;

	for (var i = 0; i < each_value.length; i += 1) {
		let child_ctx = get_each_context$4(ctx, each_value, i);
		let key = get_key(child_ctx);
		each_1_lookup.set(key, each_blocks[i] = create_each_block$4(key, child_ctx));
	}

	var studyimporter = new StudyImporter({ $$inline: true });

	return {
		c: function create() {
			if (if_block0) if_block0.c();
			t0 = space();
			if (if_block1) if_block1.c();
			t1 = space();
			if (if_block2) if_block2.c();
			t2 = space();
			div1 = element("div");

			for (i = 0; i < each_blocks.length; i += 1) each_blocks[i].c();

			t3 = space();
			div0 = element("div");
			studyimporter.$$.fragment.c();
			t4 = space();
			div2 = element("div");
			div2.textContent = "Debug: wipe database";
			div0.className = "study svelte-1ddmxdo";
			add_location(div0, file$i, 123, 2, 3269);
			div1.className = "container svelte-1ddmxdo";
			add_location(div1, file$i, 110, 0, 2878);
			div2.className = "debug svelte-1ddmxdo";
			add_location(div2, file$i, 128, 0, 3333);

			dispose = [
				listen(window, "keyup", ctx.closeDetailView),
				listen(div2, "click", dropDB)
			];
		},

		l: function claim(nodes) {
			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
		},

		m: function mount(target, anchor) {
			if (if_block0) if_block0.m(target, anchor);
			insert(target, t0, anchor);
			if (if_block1) if_block1.m(target, anchor);
			insert(target, t1, anchor);
			if (if_block2) if_block2.m(target, anchor);
			insert(target, t2, anchor);
			insert(target, div1, anchor);

			for (i = 0; i < each_blocks.length; i += 1) each_blocks[i].m(div1, null);

			append(div1, t3);
			append(div1, div0);
			mount_component(studyimporter, div0, null);
			insert(target, t4, anchor);
			insert(target, div2, anchor);
			current = true;
		},

		p: function update(changed, ctx) {
			if (ctx.toggleVars) {
				if (if_block0) {
					if_block0.p(changed, ctx);
					if_block0.i(1);
				} else {
					if_block0 = create_if_block_2(ctx);
					if_block0.c();
					if_block0.i(1);
					if_block0.m(t0.parentNode, t0);
				}
			} else if (if_block0) {
				group_outros();
				on_outro(() => {
					if_block0.d(1);
					if_block0 = null;
				});

				if_block0.o(1);
				check_outros();
			}

			if (ctx.toggleUsers) {
				if (if_block1) {
					if_block1.p(changed, ctx);
					if_block1.i(1);
				} else {
					if_block1 = create_if_block_1$1(ctx);
					if_block1.c();
					if_block1.i(1);
					if_block1.m(t1.parentNode, t1);
				}
			} else if (if_block1) {
				group_outros();
				on_outro(() => {
					if_block1.d(1);
					if_block1 = null;
				});

				if_block1.o(1);
				check_outros();
			}

			if (ctx.toggleResponses) {
				if (if_block2) {
					if_block2.p(changed, ctx);
					if_block2.i(1);
				} else {
					if_block2 = create_if_block$3(ctx);
					if_block2.c();
					if_block2.i(1);
					if_block2.m(t2.parentNode, t2);
				}
			} else if (if_block2) {
				group_outros();
				on_outro(() => {
					if_block2.d(1);
					if_block2 = null;
				});

				if_block2.o(1);
				check_outros();
			}

			const each_value = ctx.$studyStore;

			group_outros();
			for (let i = 0; i < each_blocks.length; i += 1) each_blocks[i].r();
			each_blocks = update_keyed_each(each_blocks, changed, get_key, 1, ctx, each_value, each_1_lookup, div1, fix_and_outro_and_destroy_block, create_each_block$4, t3, get_each_context$4);
			for (let i = 0; i < each_blocks.length; i += 1) each_blocks[i].a();
			check_outros();
		},

		i: function intro(local) {
			if (current) return;
			if (if_block0) if_block0.i();
			if (if_block1) if_block1.i();
			if (if_block2) if_block2.i();

			for (var i = 0; i < each_value.length; i += 1) each_blocks[i].i();

			studyimporter.$$.fragment.i(local);

			if (!div1_intro) {
				add_render_callback(() => {
					div1_intro = create_in_transition(div1, fade, { duration: 300 });
					div1_intro.start();
				});
			}

			current = true;
		},

		o: function outro(local) {
			if (if_block0) if_block0.o();
			if (if_block1) if_block1.o();
			if (if_block2) if_block2.o();

			for (i = 0; i < each_blocks.length; i += 1) each_blocks[i].o();

			studyimporter.$$.fragment.o(local);
			current = false;
		},

		d: function destroy(detaching) {
			if (if_block0) if_block0.d(detaching);

			if (detaching) {
				detach(t0);
			}

			if (if_block1) if_block1.d(detaching);

			if (detaching) {
				detach(t1);
			}

			if (if_block2) if_block2.d(detaching);

			if (detaching) {
				detach(t2);
				detach(div1);
			}

			for (i = 0; i < each_blocks.length; i += 1) each_blocks[i].d();

			studyimporter.$destroy();

			if (detaching) {
				detach(t4);
				detach(div2);
			}

			run_all(dispose);
		}
	};
}

function dropDB() {
  if (!confirm("Drop current database?")) return;
  console.log("delete db", dbName);

  window.indexedDB.deleteDatabase(dbName);
  location.reload(true);
}

function instance$f($$self, $$props, $$invalidate) {
	let $studyStore;

	validate_store(studyStore, 'studyStore');
	subscribe($$self, studyStore, $$value => { $studyStore = $$value; $$invalidate('$studyStore', $studyStore); });

	

  let studyData = {};
  let toggleVars = false;
  function showVars(event) {
    $$invalidate('studyData', studyData = event.detail);
    $$invalidate('toggleVars', toggleVars = true);
  }
  let toggleUsers = false;
  function showUsers(event) {
    $$invalidate('studyData', studyData = event.detail);
    $$invalidate('toggleUsers', toggleUsers = true);
  }
  let toggleResponses = false;
  function showResponses(event) {
    $$invalidate('studyData', studyData = event.detail);
    $$invalidate('toggleResponses', toggleResponses = true);
  }

  function closeDetailView(e) {
    if (e.code === "Escape") {
      $$invalidate('toggleVars', toggleVars = false);
      $$invalidate('toggleUsers', toggleUsers = false);
      $$invalidate('toggleResponses', toggleResponses = false);
    }
  }

	function click_handler() {
		const $$result = (toggleVars = false);
		$$invalidate('toggleVars', toggleVars);
		return $$result;
	}

	function click_handler_1() {
		const $$result = (toggleUsers = false);
		$$invalidate('toggleUsers', toggleUsers);
		return $$result;
	}

	function click_handler_2() {
		const $$result = (toggleResponses = false);
		$$invalidate('toggleResponses', toggleResponses);
		return $$result;
	}

	return {
		studyData,
		toggleVars,
		showVars,
		toggleUsers,
		showUsers,
		toggleResponses,
		showResponses,
		closeDetailView,
		$studyStore,
		click_handler,
		click_handler_1,
		click_handler_2
	};
}

class StudyList extends SvelteComponentDev {
	constructor(options) {
		super(options);
		init(this, options, instance$f, create_fragment$i, safe_not_equal, []);
	}
}

var commonjsGlobal = typeof globalThis !== 'undefined' ? globalThis : typeof window !== 'undefined' ? window : typeof global !== 'undefined' ? global : typeof self !== 'undefined' ? self : {};

function createCommonjsModule(fn, module) {
	return module = { exports: {} }, fn(module, module.exports), module.exports;
}

var simpleStatistics_min = createCommonjsModule(function (module, exports) {
!function(t,r){r(exports);}(commonjsGlobal,function(t){function r(t){if(0===t.length)return 0;for(var r,n=t[0],e=0,a=1;a<t.length;a++)r=n+t[a],Math.abs(n)>=Math.abs(t[a])?e+=n-r+t[a]:e+=t[a]-r+n,n=r;return n+e}function n(t){if(0===t.length)throw new Error("mean requires at least one data point");return r(t)/t.length}function e(t,r){var e,a,o=n(t),i=0;if(2===r)for(a=0;a<t.length;a++)i+=(e=t[a]-o)*e;else for(a=0;a<t.length;a++)i+=Math.pow(t[a]-o,r);return i}function a(t){if(0===t.length)throw new Error("variance requires at least one data point");return e(t,2)/t.length}function o(t){if(1===t.length)return 0;var r=a(t);return Math.sqrt(r)}function i(t){if(0===t.length)throw new Error("mode requires at least one data point");if(1===t.length)return t[0];for(var r=t[0],n=NaN,e=0,a=1,o=1;o<t.length+1;o++)t[o]!==r?(a>e&&(e=a,n=r),a=1,r=t[o]):a++;return n}function u(t){return t.slice().sort(function(t,r){return t-r})}function h(t){if(0===t.length)throw new Error("min requires at least one data point");for(var r=t[0],n=1;n<t.length;n++)t[n]<r&&(r=t[n]);return r}function f(t){if(0===t.length)throw new Error("max requires at least one data point");for(var r=t[0],n=1;n<t.length;n++)t[n]>r&&(r=t[n]);return r}function s(t,r){var n=t.length*r;if(0===t.length)throw new Error("quantile requires at least one data point.");if(r<0||r>1)throw new Error("quantiles must be between 0 and 1");return 1===r?t[t.length-1]:0===r?t[0]:n%1!=0?t[Math.ceil(n)-1]:t.length%2==0?(t[n-1]+t[n])/2:t[n]}function l(t,r,n,e){for(n=n||0,e=e||t.length-1;e>n;){if(e-n>600){var a=e-n+1,o=r-n+1,i=Math.log(a),u=.5*Math.exp(2*i/3),h=.5*Math.sqrt(i*u*(a-u)/a);o-a/2<0&&(h*=-1),l(t,r,Math.max(n,Math.floor(r-o*u/a+h)),Math.min(e,Math.floor(r+(a-o)*u/a+h)));}var f=t[r],s=n,g=e;for(c(t,n,r),t[e]>f&&c(t,n,e);s<g;){for(c(t,s,g),s++,g--;t[s]<f;)s++;for(;t[g]>f;)g--;}t[n]===f?c(t,n,g):c(t,++g,e),g<=r&&(n=g+1),r<=g&&(e=g-1);}}function c(t,r,n){var e=t[r];t[r]=t[n],t[n]=e;}function g(t,r){var n=t.slice();if(Array.isArray(r)){!function(t,r){for(var n=[0],e=0;e<r.length;e++)n.push(w(t.length,r[e]));n.push(t.length-1),n.sort(p);for(var a=[0,n.length-1];a.length;){var o=Math.ceil(a.pop()),i=Math.floor(a.pop());if(!(o-i<=1)){var u=Math.floor((i+o)/2);v(t,n[u],Math.floor(n[i]),Math.ceil(n[o])),a.push(i,u,u,o);}}}(n,r);for(var e=[],a=0;a<r.length;a++)e[a]=s(n,r[a]);return e}return v(n,w(n.length,r),0,n.length-1),s(n,r)}function v(t,r,n,e){r%1==0?l(t,r,n,e):(l(t,r=Math.floor(r),n,e),l(t,r+1,r+1,e));}function p(t,r){return t-r}function w(t,r){var n=t*r;return 1===r?t-1:0===r?0:n%1!=0?Math.ceil(n)-1:t%2==0?n-.5:n}function M(t,r){if(r<t[0])return 0;if(r>t[t.length-1])return 1;var n=function(t,r){for(var n=0,e=0,a=t.length;e<a;)r<=t[n=e+a>>>1]?a=n:e=-~n;return e}(t,r);if(t[n]!==r)return n/t.length;n++;var e=function(t,r){for(var n=0,e=0,a=t.length;e<a;)r>=t[n=e+a>>>1]?e=-~n:a=n;return e}(t,r);if(e===n)return n/t.length;var a=e-n+1;return a*(e+n)/2/a/t.length}function m(t){var r=g(t,.75),n=g(t,.25);if("number"==typeof r&&"number"==typeof n)return r-n}function d(t){return +g(t,.5)}function b(t){for(var r=d(t),n=[],e=0;e<t.length;e++)n.push(Math.abs(t[e]-r));return d(n)}function q(t,r){r=r||Math.random;for(var n,e,a=t.length;a>0;)e=Math.floor(r()*a--),n=t[a],t[a]=t[e],t[e]=n;return t}function E(t,r){return q(t.slice().slice(),r)}function y(t){for(var r,n=0,e=0;e<t.length;e++)0!==e&&t[e]===r||(r=t[e],n++);return n}function S(t,r){for(var n=[],e=0;e<t;e++){for(var a=[],o=0;o<r;o++)a.push(0);n.push(a);}return n}function x(t,r,n,e){var a;if(t>0){var o=(n[r]-n[t-1])/(r-t+1);a=e[r]-e[t-1]-(r-t+1)*o*o;}else a=e[r]-n[r]*n[r]/(r+1);return a<0?0:a}function k(t,r,n,e,a,o,i){if(!(t>r)){var u=Math.floor((t+r)/2);e[n][u]=e[n-1][u-1],a[n][u]=u;var h=n;t>n&&(h=Math.max(h,a[n][t-1]||0)),h=Math.max(h,a[n-1][u]||0);var f,s,l,c=u-1;r<e.length-1&&(c=Math.min(c,a[n][r+1]||0));for(var g=c;g>=h&&!((f=x(g,u,o,i))+e[n-1][h-1]>=e[n][u]);--g)(s=x(h,u,o,i)+e[n-1][h-1])<e[n][u]&&(e[n][u]=s,a[n][u]=h),h++,(l=f+e[n-1][g-1])<e[n][u]&&(e[n][u]=l,a[n][u]=g);k(t,u-1,n,e,a,o,i),k(u+1,r,n,e,a,o,i);}}function I(t,r){if(t.length!==r.length)throw new Error("sampleCovariance requires samples with equal lengths");if(t.length<2)throw new Error("sampleCovariance requires at least two data points in each sample");for(var e=n(t),a=n(r),o=0,i=0;i<t.length;i++)o+=(t[i]-e)*(r[i]-a);return o/(t.length-1)}function P(t){if(t.length<2)throw new Error("sampleVariance requires at least two data points");return e(t,2)/(t.length-1)}function D(t){var r=P(t);return Math.sqrt(r)}function C(t,r,n,e){return (t*r+n*e)/(r+e)}function T(t){if(0===t.length)throw new Error("rootMeanSquare requires at least one data point");for(var r=0,n=0;n<t.length;n++)r+=Math.pow(t[n],2);return Math.sqrt(r/t.length)}var N=function(){this.totalCount=0,this.data={};};N.prototype.train=function(t,r){for(var n in this.data[r]||(this.data[r]={}),t){var e=t[n];void 0===this.data[r][n]&&(this.data[r][n]={}),void 0===this.data[r][n][e]&&(this.data[r][n][e]=0),this.data[r][n][e]++;}this.totalCount++;},N.prototype.score=function(t){var r,n={};for(var e in t){var a=t[e];for(r in this.data)n[r]={},n[r][e+"_"+a]=this.data[r][e]?(this.data[r][e][a]||0)/this.totalCount:0;}var o={};for(r in n)for(var i in o[r]=0,n[r])o[r]+=n[r][i];return o};var R=function(){this.weights=[],this.bias=0;};function F(t){if(t<0)throw new Error("factorial requires a non-negative value");if(Math.floor(t)!==t)throw new Error("factorial requires an integer input");for(var r=1,n=2;n<=t;n++)r*=n;return r}R.prototype.predict=function(t){if(t.length!==this.weights.length)return null;for(var r=0,n=0;n<this.weights.length;n++)r+=this.weights[n]*t[n];return (r+=this.bias)>0?1:0},R.prototype.train=function(t,r){if(0!==r&&1!==r)return null;t.length!==this.weights.length&&(this.weights=t,this.bias=1);var n=this.predict(t);if("number"==typeof n&&n!==r){for(var e=r-n,a=0;a<this.weights.length;a++)this.weights[a]+=e*t[a];this.bias+=e;}return this};var A=[.9999999999999971,57.15623566586292,-59.59796035547549,14.136097974741746,-.4919138160976202,3399464998481189e-20,4652362892704858e-20,-9837447530487956e-20,.0001580887032249125,-.00021026444172410488,.00021743961811521265,-.0001643181065367639,8441822398385275e-20,-26190838401581408e-21,36899182659531625e-22],_=Math.log(Math.sqrt(2*Math.PI)),z={1:{.995:0,.99:0,.975:0,.95:0,.9:.02,.5:.45,.1:2.71,.05:3.84,.025:5.02,.01:6.63,.005:7.88},2:{.995:.01,.99:.02,.975:.05,.95:.1,.9:.21,.5:1.39,.1:4.61,.05:5.99,.025:7.38,.01:9.21,.005:10.6},3:{.995:.07,.99:.11,.975:.22,.95:.35,.9:.58,.5:2.37,.1:6.25,.05:7.81,.025:9.35,.01:11.34,.005:12.84},4:{.995:.21,.99:.3,.975:.48,.95:.71,.9:1.06,.5:3.36,.1:7.78,.05:9.49,.025:11.14,.01:13.28,.005:14.86},5:{.995:.41,.99:.55,.975:.83,.95:1.15,.9:1.61,.5:4.35,.1:9.24,.05:11.07,.025:12.83,.01:15.09,.005:16.75},6:{.995:.68,.99:.87,.975:1.24,.95:1.64,.9:2.2,.5:5.35,.1:10.65,.05:12.59,.025:14.45,.01:16.81,.005:18.55},7:{.995:.99,.99:1.25,.975:1.69,.95:2.17,.9:2.83,.5:6.35,.1:12.02,.05:14.07,.025:16.01,.01:18.48,.005:20.28},8:{.995:1.34,.99:1.65,.975:2.18,.95:2.73,.9:3.49,.5:7.34,.1:13.36,.05:15.51,.025:17.53,.01:20.09,.005:21.96},9:{.995:1.73,.99:2.09,.975:2.7,.95:3.33,.9:4.17,.5:8.34,.1:14.68,.05:16.92,.025:19.02,.01:21.67,.005:23.59},10:{.995:2.16,.99:2.56,.975:3.25,.95:3.94,.9:4.87,.5:9.34,.1:15.99,.05:18.31,.025:20.48,.01:23.21,.005:25.19},11:{.995:2.6,.99:3.05,.975:3.82,.95:4.57,.9:5.58,.5:10.34,.1:17.28,.05:19.68,.025:21.92,.01:24.72,.005:26.76},12:{.995:3.07,.99:3.57,.975:4.4,.95:5.23,.9:6.3,.5:11.34,.1:18.55,.05:21.03,.025:23.34,.01:26.22,.005:28.3},13:{.995:3.57,.99:4.11,.975:5.01,.95:5.89,.9:7.04,.5:12.34,.1:19.81,.05:22.36,.025:24.74,.01:27.69,.005:29.82},14:{.995:4.07,.99:4.66,.975:5.63,.95:6.57,.9:7.79,.5:13.34,.1:21.06,.05:23.68,.025:26.12,.01:29.14,.005:31.32},15:{.995:4.6,.99:5.23,.975:6.27,.95:7.26,.9:8.55,.5:14.34,.1:22.31,.05:25,.025:27.49,.01:30.58,.005:32.8},16:{.995:5.14,.99:5.81,.975:6.91,.95:7.96,.9:9.31,.5:15.34,.1:23.54,.05:26.3,.025:28.85,.01:32,.005:34.27},17:{.995:5.7,.99:6.41,.975:7.56,.95:8.67,.9:10.09,.5:16.34,.1:24.77,.05:27.59,.025:30.19,.01:33.41,.005:35.72},18:{.995:6.26,.99:7.01,.975:8.23,.95:9.39,.9:10.87,.5:17.34,.1:25.99,.05:28.87,.025:31.53,.01:34.81,.005:37.16},19:{.995:6.84,.99:7.63,.975:8.91,.95:10.12,.9:11.65,.5:18.34,.1:27.2,.05:30.14,.025:32.85,.01:36.19,.005:38.58},20:{.995:7.43,.99:8.26,.975:9.59,.95:10.85,.9:12.44,.5:19.34,.1:28.41,.05:31.41,.025:34.17,.01:37.57,.005:40},21:{.995:8.03,.99:8.9,.975:10.28,.95:11.59,.9:13.24,.5:20.34,.1:29.62,.05:32.67,.025:35.48,.01:38.93,.005:41.4},22:{.995:8.64,.99:9.54,.975:10.98,.95:12.34,.9:14.04,.5:21.34,.1:30.81,.05:33.92,.025:36.78,.01:40.29,.005:42.8},23:{.995:9.26,.99:10.2,.975:11.69,.95:13.09,.9:14.85,.5:22.34,.1:32.01,.05:35.17,.025:38.08,.01:41.64,.005:44.18},24:{.995:9.89,.99:10.86,.975:12.4,.95:13.85,.9:15.66,.5:23.34,.1:33.2,.05:36.42,.025:39.36,.01:42.98,.005:45.56},25:{.995:10.52,.99:11.52,.975:13.12,.95:14.61,.9:16.47,.5:24.34,.1:34.28,.05:37.65,.025:40.65,.01:44.31,.005:46.93},26:{.995:11.16,.99:12.2,.975:13.84,.95:15.38,.9:17.29,.5:25.34,.1:35.56,.05:38.89,.025:41.92,.01:45.64,.005:48.29},27:{.995:11.81,.99:12.88,.975:14.57,.95:16.15,.9:18.11,.5:26.34,.1:36.74,.05:40.11,.025:43.19,.01:46.96,.005:49.65},28:{.995:12.46,.99:13.57,.975:15.31,.95:16.93,.9:18.94,.5:27.34,.1:37.92,.05:41.34,.025:44.46,.01:48.28,.005:50.99},29:{.995:13.12,.99:14.26,.975:16.05,.95:17.71,.9:19.77,.5:28.34,.1:39.09,.05:42.56,.025:45.72,.01:49.59,.005:52.34},30:{.995:13.79,.99:14.95,.975:16.79,.95:18.49,.9:20.6,.5:29.34,.1:40.26,.05:43.77,.025:46.98,.01:50.89,.005:53.67},40:{.995:20.71,.99:22.16,.975:24.43,.95:26.51,.9:29.05,.5:39.34,.1:51.81,.05:55.76,.025:59.34,.01:63.69,.005:66.77},50:{.995:27.99,.99:29.71,.975:32.36,.95:34.76,.9:37.69,.5:49.33,.1:63.17,.05:67.5,.025:71.42,.01:76.15,.005:79.49},60:{.995:35.53,.99:37.48,.975:40.48,.95:43.19,.9:46.46,.5:59.33,.1:74.4,.05:79.08,.025:83.3,.01:88.38,.005:91.95},70:{.995:43.28,.99:45.44,.975:48.76,.95:51.74,.9:55.33,.5:69.33,.1:85.53,.05:90.53,.025:95.02,.01:100.42,.005:104.22},80:{.995:51.17,.99:53.54,.975:57.15,.95:60.39,.9:64.28,.5:79.33,.1:96.58,.05:101.88,.025:106.63,.01:112.33,.005:116.32},90:{.995:59.2,.99:61.75,.975:65.65,.95:69.13,.9:73.29,.5:89.33,.1:107.57,.05:113.14,.025:118.14,.01:124.12,.005:128.3},100:{.995:67.33,.99:70.06,.975:74.22,.95:77.93,.9:82.36,.5:99.33,.1:118.5,.05:124.34,.025:129.56,.01:135.81,.005:140.17}},V=Math.sqrt(2*Math.PI),B={gaussian:function(t){return Math.exp(-.5*t*t)/V}},K={nrd:function(t){var r=D(t),n=m(t);return "number"==typeof n&&(r=Math.min(r,n/1.34)),1.06*r*Math.pow(t.length,-.2)}};function U(t,r,n){var e,a;if(void 0===r)e=B.gaussian;else if("string"==typeof r){if(!B[r])throw new Error('Unknown kernel "'+r+'"');e=B[r];}else e=r;if(void 0===n)a=K.nrd(t);else if("string"==typeof n){if(!K[n])throw new Error('Unknown bandwidth method "'+n+'"');a=K[n](t);}else a=n;return function(r){var n=0,o=0;for(n=0;n<t.length;n++)o+=e((r-t[n])/a);return o/a/t.length}}var j=Math.sqrt(2*Math.PI);function G(t){for(var r=t,n=t,e=1;e<15;e++)r+=n*=t*t/(2*e+1);return Math.round(1e4*(.5+r/j*Math.exp(-t*t/2)))/1e4}for(var H=[],L=0;L<=3.09;L+=.01)H.push(G(L));function O(t){var r=1/(1+.5*Math.abs(t)),n=r*Math.exp(-t*t+((((((((.17087277*r-.82215223)*r+1.48851587)*r-1.13520398)*r+.27886807)*r-.18628806)*r+.09678418)*r+.37409196)*r+1.00002368)*r-1.26551223);return t>=0?1-n:n-1}function W(t){var r=8*(Math.PI-3)/(3*Math.PI*(4-Math.PI)),n=Math.sqrt(Math.sqrt(Math.pow(2/(Math.PI*r)+Math.log(1-t*t)/2,2)-Math.log(1-t*t)/r)-(2/(Math.PI*r)+Math.log(1-t*t)/2));return t>=0?n:-n}function J(t){if("number"==typeof t)return t<0?-1:0===t?0:1;throw new TypeError("not a number")}t.linearRegression=function(t){var r,n,e=t.length;if(1===e)r=0,n=t[0][1];else{for(var a,o,i,u=0,h=0,f=0,s=0,l=0;l<e;l++)u+=o=(a=t[l])[0],h+=i=a[1],f+=o*o,s+=o*i;n=h/e-(r=(e*s-u*h)/(e*f-u*u))*u/e;}return {m:r,b:n}},t.linearRegressionLine=function(t){return function(r){return t.b+t.m*r}},t.standardDeviation=o,t.rSquared=function(t,r){if(t.length<2)return 1;for(var n=0,e=0;e<t.length;e++)n+=t[e][1];for(var a=n/t.length,o=0,i=0;i<t.length;i++)o+=Math.pow(a-t[i][1],2);for(var u=0,h=0;h<t.length;h++)u+=Math.pow(t[h][1]-r(t[h][0]),2);return 1-u/o},t.mode=function(t){return i(u(t))},t.modeFast=function(t){for(var r,n=new Map,e=0,a=0;a<t.length;a++){var o=n.get(t[a]);void 0===o?o=1:o++,o>e&&(r=t[a],e=o),n.set(t[a],o);}if(0===e)throw new Error("mode requires at last one data point");return r},t.modeSorted=i,t.min=h,t.max=f,t.extent=function(t){if(0===t.length)throw new Error("extent requires at least one data point");for(var r=t[0],n=t[0],e=1;e<t.length;e++)t[e]>n&&(n=t[e]),t[e]<r&&(r=t[e]);return [r,n]},t.minSorted=function(t){return t[0]},t.maxSorted=function(t){return t[t.length-1]},t.extentSorted=function(t){return [t[0],t[t.length-1]]},t.sum=r,t.sumSimple=function(t){for(var r=0,n=0;n<t.length;n++)r+=t[n];return r},t.product=function(t){for(var r=1,n=0;n<t.length;n++)r*=t[n];return r},t.quantile=g,t.quantileSorted=s,t.quantileRank=function(t,r){return M(u(t),r)},t.quantileRankSorted=M,t.interquartileRange=m,t.iqr=m,t.medianAbsoluteDeviation=b,t.mad=b,t.chunk=function(t,r){var n=[];if(r<1)throw new Error("chunk size must be a positive number");if(Math.floor(r)!==r)throw new Error("chunk size must be an integer");for(var e=0;e<t.length;e+=r)n.push(t.slice(e,e+r));return n},t.sampleWithReplacement=function(t,r,n){if(0===t.length)return [];n=n||Math.random;for(var e=t.length,a=[],o=0;o<r;o++){var i=Math.floor(n()*e);a.push(t[i]);}return a},t.shuffle=E,t.shuffleInPlace=q,t.sample=function(t,r,n){return E(t,n).slice(0,r)},t.ckmeans=function(t,r){if(r>t.length)throw new Error("cannot generate more classes than there are data values");var n=u(t);if(1===y(n))return [n];var e=S(r,n.length),a=S(r,n.length);!function(t,r,n){for(var e=r[0].length,a=t[Math.floor(e/2)],o=[],i=[],u=0,h=void 0;u<e;++u)h=t[u]-a,0===u?(o.push(h),i.push(h*h)):(o.push(o[u-1]+h),i.push(i[u-1]+h*h)),r[0][u]=x(0,u,o,i),n[0][u]=0;for(var f=1;f<r.length;++f)k(f<r.length-1?f:e-1,e-1,f,r,n,o,i);}(n,e,a);for(var o=[],i=a[0].length-1,h=a.length-1;h>=0;h--){var f=a[h][i];o[h]=n.slice(f,i+1),h>0&&(i=f-1);}return o},t.uniqueCountSorted=y,t.sumNthPowerDeviations=e,t.equalIntervalBreaks=function(t,r){if(t.length<2)return t;for(var n=h(t),e=f(t),a=[n],o=(e-n)/r,i=1;i<r;i++)a.push(a[0]+o*i);return a.push(e),a},t.sampleCovariance=I,t.sampleCorrelation=function(t,r){return I(t,r)/D(t)/D(r)},t.sampleVariance=P,t.sampleStandardDeviation=D,t.sampleSkewness=function(t){if(t.length<3)throw new Error("sampleSkewness requires at least three data points");for(var r,e=n(t),a=0,o=0,i=0;i<t.length;i++)a+=(r=t[i]-e)*r,o+=r*r*r;var u=Math.sqrt(a/(t.length-1)),h=t.length;return h*o/((h-1)*(h-2)*Math.pow(u,3))},t.sampleKurtosis=function(t){var r=t.length;if(r<4)throw new Error("sampleKurtosis requires at least four data points");for(var e,a=n(t),o=0,i=0,u=0;u<r;u++)o+=(e=t[u]-a)*e,i+=e*e*e*e;return (r-1)/((r-2)*(r-3))*(r*(r+1)*i/(o*o)-3*(r-1))},t.permutationsHeap=function(t){for(var r=new Array(t.length),n=[t.slice()],e=0;e<t.length;e++)r[e]=0;for(var a=0;a<t.length;)if(r[a]<a){var o=0;a%2!=0&&(o=r[a]);var i=t[o];t[o]=t[a],t[a]=i,n.push(t.slice()),r[a]++,a=0;}else r[a]=0,a++;return n},t.combinations=function t(r,n){var e,a,o,i,u=[];for(e=0;e<r.length;e++)if(1===n)u.push([r[e]]);else for(o=t(r.slice(e+1,r.length),n-1),a=0;a<o.length;a++)(i=o[a]).unshift(r[e]),u.push(i);return u},t.combinationsReplacement=function t(r,n){for(var e=[],a=0;a<r.length;a++)if(1===n)e.push([r[a]]);else for(var o=t(r.slice(a,r.length),n-1),i=0;i<o.length;i++)e.push([r[a]].concat(o[i]));return e},t.addToMean=function(t,r,n){return t+(n-t)/(r+1)},t.combineMeans=C,t.combineVariances=function(t,r,n,e,a,o){var i=C(r,n,a,o);return (n*(t+Math.pow(r-i,2))+o*(e+Math.pow(a-i,2)))/(n+o)},t.geometricMean=function(t){if(0===t.length)throw new Error("geometricMean requires at least one data point");for(var r=1,n=0;n<t.length;n++){if(t[n]<=0)throw new Error("geometricMean requires only positive numbers as input");r*=t[n];}return Math.pow(r,1/t.length)},t.harmonicMean=function(t){if(0===t.length)throw new Error("harmonicMean requires at least one data point");for(var r=0,n=0;n<t.length;n++){if(t[n]<=0)throw new Error("harmonicMean requires only positive numbers as input");r+=1/t[n];}return t.length/r},t.average=n,t.mean=n,t.median=d,t.medianSorted=function(t){return s(t,.5)},t.subtractFromMean=function(t,r,n){return (t*r-n)/(r-1)},t.rootMeanSquare=T,t.rms=T,t.variance=a,t.tTest=function(t,r){return (n(t)-r)/(o(t)/Math.sqrt(t.length))},t.tTestTwoSample=function(t,r,e){var a=t.length,o=r.length;if(!a||!o)return null;e||(e=0);var i=n(t),u=n(r),h=P(t),f=P(r);return "number"==typeof i&&"number"==typeof u&&"number"==typeof h&&"number"==typeof f?(i-u-e)/Math.sqrt(((a-1)*h+(o-1)*f)/(a+o-2)*(1/a+1/o)):void 0},t.BayesianClassifier=N,t.bayesian=N,t.PerceptronModel=R,t.perceptron=R,t.epsilon=1e-4,t.factorial=F,t.gamma=function t(r){if(Number.isInteger(r))return r<=0?NaN:F(r-1);if(--r<0)return Math.PI/(Math.sin(Math.PI*-r)*t(-r));var n=r+.25;return Math.pow(r/Math.E,r)*Math.sqrt(2*Math.PI*(r+1/6))*(1+1/144/Math.pow(n,2)-1/12960/Math.pow(n,3)-257/207360/Math.pow(n,4)-52/2612736/Math.pow(n,5)+5741173/9405849600/Math.pow(n,6)+37529/18811699200/Math.pow(n,7))},t.gammaln=function(t){if(t<=0)return Infinity;t--;for(var r=A[0],n=1;n<15;n++)r+=A[n]/(t+n);var e=5.2421875+t;return _+Math.log(r)-e+(t+.5)*Math.log(e)},t.bernoulliDistribution=function(t){if(t<0||t>1)throw new Error("bernoulliDistribution requires probability to be between 0 and 1 inclusive");return [1-t,t]},t.binomialDistribution=function(t,r){if(!(r<0||r>1||t<=0||t%1!=0)){var n=0,e=0,a=[],o=1;do{a[n]=o*Math.pow(r,n)*Math.pow(1-r,t-n),e+=a[n],o=o*(t-++n+1)/n;}while(e<.9999);return a}},t.poissonDistribution=function(t){if(!(t<=0)){var r=0,n=0,e=[],a=1;do{e[r]=Math.exp(-t)*Math.pow(t,r)/a,n+=e[r],a*=++r;}while(n<.9999);return e}},t.chiSquaredDistributionTable=z,t.chiSquaredGoodnessOfFit=function(t,r,e){for(var a=0,o=r(n(t)),i=[],u=[],h=0;h<t.length;h++)void 0===i[t[h]]&&(i[t[h]]=0),i[t[h]]++;for(var f=0;f<i.length;f++)void 0===i[f]&&(i[f]=0);for(var s in o)s in i&&(u[+s]=o[s]*t.length);for(var l=u.length-1;l>=0;l--)u[l]<3&&(u[l-1]+=u[l],u.pop(),i[l-1]+=i[l],i.pop());for(var c=0;c<i.length;c++)a+=Math.pow(i[c]-u[c],2)/u[c];return z[i.length-1-1][e]<a},t.kernelDensityEstimation=U,t.kde=U,t.zScore=function(t,r,n){return (t-r)/n},t.cumulativeStdNormalProbability=function(t){var r=Math.abs(t),n=Math.min(Math.round(100*r),H.length-1);return t>=0?H[n]:+(1-H[n]).toFixed(4)},t.standardNormalTable=H,t.errorFunction=O,t.erf=O,t.inverseErrorFunction=W,t.probit=function(t){return 0===t?t=1e-4:t>=1&&(t=.9999),Math.sqrt(2)*W(2*t-1)},t.permutationTest=function(t,r,e,a){if(void 0===a&&(a=1e4),void 0===e&&(e="two_side"),"two_side"!==e&&"greater"!==e&&"less"!==e)throw new Error("`alternative` must be either 'two_side', 'greater', or 'less'");for(var o=n(t)-n(r),i=new Array(a),u=t.concat(r),h=Math.floor(u.length/2),f=0;f<a;f++){q(u);var s=u.slice(0,h),l=u.slice(h,u.length),c=n(s)-n(l);i[f]=c;}var g=0;if("two_side"===e)for(var v=0;v<=a;v++)Math.abs(i[v])>=Math.abs(o)&&(g+=1);else if("greater"===e)for(var p=0;p<=a;p++)i[p]>=o&&(g+=1);else for(var w=0;w<=a;w++)i[w]<=o&&(g+=1);return g/a},t.bisect=function(t,r,n,e,a){if("function"!=typeof t)throw new TypeError("func must be a function");for(var o=0;o<e;o++){var i=(r+n)/2;if(0===t(i)||Math.abs((n-r)/2)<a)return i;J(t(i))===J(t(r))?r=i:n=i;}throw new Error("maximum number of iterations exceeded")},t.quickselect=l,t.sign=J,t.numericSort=u;});
//# sourceMappingURL=simple-statistics.min.js.map
});

/* src\charts\VariableNominalChart.svelte generated by Svelte v3.5.1 */

const file$j = "src\\charts\\VariableNominalChart.svelte";

function create_fragment$j(ctx) {
	var div;

	return {
		c: function create() {
			div = element("div");
			div.id = ctx.chartId;
			add_location(div, file$j, 51, 0, 1384);
		},

		l: function claim(nodes) {
			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
		},

		m: function mount(target, anchor) {
			insert(target, div, anchor);
		},

		p: noop,
		i: noop,
		o: noop,

		d: function destroy(detaching) {
			if (detaching) {
				detach(div);
			}
		}
	};
}

function instance$g($$self, $$props, $$invalidate) {
	let { variable } = $$props;
  const variableName = variable.variableName;
  const chartId = `vis${variableName}nominal`;
  const trunc = (t, n = 10) => t.substr(0, n - 1) + (t.length > n ? "..." : "");

  // vega-lite charts
  const vegaOptions = {
    renderer: "svg",
    mode: "vega-lite",
    actions: { export: true, source: false, editor: false, compiled: false },
    downloadFileName: `sensQvis_chart_${variableName}_nominal`
  };
  let data = variable.results.map(v => v.value);
  if (variable.dataformat.textChoices) {
    // map values to labels
    const answerMap = {};
    for (const choice of variable.dataformat.textChoices) {
      answerMap[choice.value] = trunc(choice.valueLabel || choice.text);
    }
    data = data.map(v => answerMap[v]);
  }

  const spec = {
    description: `Count of ${variableName} results`,
    data: {
      values: data
    },
    mark: "bar",
    encoding: {
      y: {
        field: "data",
        type: "nominal",
        axis: {
          title: null,
          domain: false,
          ticks: false,
          labelPadding: 5
        }
      },
      x: {
        aggregate: "count",
        type: "quantitative",
        axis: { domain: false }
      }
    }
  };
  onMount(() => vegaEmbed(`#${chartId}`, spec, vegaOptions));

	const writable_props = ['variable'];
	Object.keys($$props).forEach(key => {
		if (!writable_props.includes(key) && !key.startsWith('$$')) console.warn(`<VariableNominalChart> was created with unknown prop '${key}'`);
	});

	$$self.$set = $$props => {
		if ('variable' in $$props) $$invalidate('variable', variable = $$props.variable);
	};

	return { variable, chartId };
}

class VariableNominalChart extends SvelteComponentDev {
	constructor(options) {
		super(options);
		init(this, options, instance$g, create_fragment$j, safe_not_equal, ["variable"]);

		const { ctx } = this.$$;
		const props = options.props || {};
		if (ctx.variable === undefined && !('variable' in props)) {
			console.warn("<VariableNominalChart> was created without expected prop 'variable'");
		}
	}

	get variable() {
		throw new Error("<VariableNominalChart>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set variable(value) {
		throw new Error("<VariableNominalChart>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}
}

/* src\charts\VariableScaleChart.svelte generated by Svelte v3.5.1 */

const file$k = "src\\charts\\VariableScaleChart.svelte";

function create_fragment$k(ctx) {
	var div;

	return {
		c: function create() {
			div = element("div");
			div.id = ctx.chartId;
			add_location(div, file$k, 59, 0, 1462);
		},

		l: function claim(nodes) {
			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
		},

		m: function mount(target, anchor) {
			insert(target, div, anchor);
		},

		p: noop,
		i: noop,
		o: noop,

		d: function destroy(detaching) {
			if (detaching) {
				detach(div);
			}
		}
	};
}

function instance$h($$self, $$props, $$invalidate) {
	let { variable } = $$props;
  const variableName = variable.variableName;
  const chartId = `vis${variableName}scale`;

  // vega-lite charts
  const vegaOptions = {
    renderer: "svg",
    mode: "vega-lite",
    actions: { export: true, source: false, editor: false, compiled: false },
    downloadFileName: `sensQvis_chart_${variableName}_scale`
  };
  let data = variable.results.map(v => v.value);

  const graph1 = {
    description: `Ditribution of ${variableName}`,
    mark: "tick",
    encoding: {
      x: {
        field: "data",
        type: "quantitative",
        //scale: { domain: [Math.min(...data), Math.max(...data)] },
        axis: { title: variableName, domain: false }
      }
    }
  };

  const graph2 = {
    description: `Binned ditribution of ${variableName}`,
    mark: "bar",
    encoding: {
      x: {
        bin: true,
        field: "data",
        type: "quantitative",
        axis: { domain: false, title: `${variableName} (binned)` }
      },
      y: {
        aggregate: "count",
        type: "quantitative",
        axis: {
          domain: false,
          ticks: false,
          labelPadding: 5,
          titlePadding: 10
        }
      }
    }
  };
  const spec = {
    data: {
      values: data
    },
    vconcat: [graph1, graph2]
  };
  onMount(() => vegaEmbed(`#${chartId}`, spec, vegaOptions));

	const writable_props = ['variable'];
	Object.keys($$props).forEach(key => {
		if (!writable_props.includes(key) && !key.startsWith('$$')) console.warn(`<VariableScaleChart> was created with unknown prop '${key}'`);
	});

	$$self.$set = $$props => {
		if ('variable' in $$props) $$invalidate('variable', variable = $$props.variable);
	};

	return { variable, chartId };
}

class VariableScaleChart extends SvelteComponentDev {
	constructor(options) {
		super(options);
		init(this, options, instance$h, create_fragment$k, safe_not_equal, ["variable"]);

		const { ctx } = this.$$;
		const props = options.props || {};
		if (ctx.variable === undefined && !('variable' in props)) {
			console.warn("<VariableScaleChart> was created without expected prop 'variable'");
		}
	}

	get variable() {
		throw new Error("<VariableScaleChart>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set variable(value) {
		throw new Error("<VariableScaleChart>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}
}

/* src\components\VariableStats.svelte generated by Svelte v3.5.1 */

const file$l = "src\\components\\VariableStats.svelte";

function get_each_context$5(ctx, list, i) {
	const child_ctx = Object.create(ctx);
	child_ctx.choice = list[i];
	return child_ctx;
}

// (70:4) {#if variable.measure == 'nominal'}
function create_if_block_5(ctx) {
	var current;

	var variablenominalchart = new VariableNominalChart({
		props: { variable: ctx.variable },
		$$inline: true
	});

	return {
		c: function create() {
			variablenominalchart.$$.fragment.c();
		},

		m: function mount(target, anchor) {
			mount_component(variablenominalchart, target, anchor);
			current = true;
		},

		p: function update(changed, ctx) {
			var variablenominalchart_changes = {};
			if (changed.variable) variablenominalchart_changes.variable = ctx.variable;
			variablenominalchart.$set(variablenominalchart_changes);
		},

		i: function intro(local) {
			if (current) return;
			variablenominalchart.$$.fragment.i(local);

			current = true;
		},

		o: function outro(local) {
			variablenominalchart.$$.fragment.o(local);
			current = false;
		},

		d: function destroy(detaching) {
			variablenominalchart.$destroy(detaching);
		}
	};
}

// (73:4) {#if variable.measure == 'scale'}
function create_if_block_4(ctx) {
	var current;

	var variablescalechart = new VariableScaleChart({
		props: { variable: ctx.variable },
		$$inline: true
	});

	return {
		c: function create() {
			variablescalechart.$$.fragment.c();
		},

		m: function mount(target, anchor) {
			mount_component(variablescalechart, target, anchor);
			current = true;
		},

		p: function update(changed, ctx) {
			var variablescalechart_changes = {};
			if (changed.variable) variablescalechart_changes.variable = ctx.variable;
			variablescalechart.$set(variablescalechart_changes);
		},

		i: function intro(local) {
			if (current) return;
			variablescalechart.$$.fragment.i(local);

			current = true;
		},

		o: function outro(local) {
			variablescalechart.$$.fragment.o(local);
			current = false;
		},

		d: function destroy(detaching) {
			variablescalechart.$destroy(detaching);
		}
	};
}

// (81:4) {#if variable.dataformat.hasOwnProperty('textChoices')}
function create_if_block_3(ctx) {
	var div, h4, t_1, table;

	var each_value = ctx.variable.dataformat.textChoices;

	var each_blocks = [];

	for (var i = 0; i < each_value.length; i += 1) {
		each_blocks[i] = create_each_block$5(get_each_context$5(ctx, each_value, i));
	}

	return {
		c: function create() {
			div = element("div");
			h4 = element("h4");
			h4.textContent = "Answer options";
			t_1 = space();
			table = element("table");

			for (var i = 0; i < each_blocks.length; i += 1) {
				each_blocks[i].c();
			}
			h4.className = "svelte-179mqmu";
			add_location(h4, file$l, 82, 8, 1860);
			table.className = "svelte-179mqmu";
			add_location(table, file$l, 83, 8, 1893);
			div.className = "choices svelte-179mqmu";
			add_location(div, file$l, 81, 6, 1829);
		},

		m: function mount(target, anchor) {
			insert(target, div, anchor);
			append(div, h4);
			append(div, t_1);
			append(div, table);

			for (var i = 0; i < each_blocks.length; i += 1) {
				each_blocks[i].m(table, null);
			}
		},

		p: function update(changed, ctx) {
			if (changed.variable) {
				each_value = ctx.variable.dataformat.textChoices;

				for (var i = 0; i < each_value.length; i += 1) {
					const child_ctx = get_each_context$5(ctx, each_value, i);

					if (each_blocks[i]) {
						each_blocks[i].p(changed, child_ctx);
					} else {
						each_blocks[i] = create_each_block$5(child_ctx);
						each_blocks[i].c();
						each_blocks[i].m(table, null);
					}
				}

				for (; i < each_blocks.length; i += 1) {
					each_blocks[i].d(1);
				}
				each_blocks.length = each_value.length;
			}
		},

		d: function destroy(detaching) {
			if (detaching) {
				detach(div);
			}

			destroy_each(each_blocks, detaching);
		}
	};
}

// (85:10) {#each variable.dataformat.textChoices as choice}
function create_each_block$5(ctx) {
	var tr, td, t0, t1_value = ctx.choice.value, t1, t2, t3_value = ctx.choice.valueLabel || ctx.choice.text, t3;

	return {
		c: function create() {
			tr = element("tr");
			td = element("td");
			t0 = text("(");
			t1 = text(t1_value);
			t2 = text(") ");
			t3 = text(t3_value);
			td.className = "svelte-179mqmu";
			add_location(td, file$l, 86, 14, 1995);
			tr.className = "svelte-179mqmu";
			add_location(tr, file$l, 85, 12, 1975);
		},

		m: function mount(target, anchor) {
			insert(target, tr, anchor);
			append(tr, td);
			append(td, t0);
			append(td, t1);
			append(td, t2);
			append(td, t3);
		},

		p: function update(changed, ctx) {
			if ((changed.variable) && t1_value !== (t1_value = ctx.choice.value)) {
				set_data(t1, t1_value);
			}

			if ((changed.variable) && t3_value !== (t3_value = ctx.choice.valueLabel || ctx.choice.text)) {
				set_data(t3, t3_value);
			}
		},

		d: function destroy(detaching) {
			if (detaching) {
				detach(tr);
			}
		}
	};
}

// (100:8) {#if variable.measure == 'scale' || variable.measure == 'ordinal'}
function create_if_block_2$1(ctx) {
	var tr, td0, t1, td1, t2_value = simpleStatistics_min.min(ctx.data), t2, t3, t4_value = simpleStatistics_min.max(ctx.data), t4;

	return {
		c: function create() {
			tr = element("tr");
			td0 = element("td");
			td0.textContent = "Min - Max:";
			t1 = space();
			td1 = element("td");
			t2 = text(t2_value);
			t3 = text(" - ");
			t4 = text(t4_value);
			td0.className = "svelte-179mqmu";
			add_location(td0, file$l, 101, 12, 2429);
			td1.className = "svelte-179mqmu";
			add_location(td1, file$l, 102, 12, 2462);
			tr.className = "svelte-179mqmu";
			add_location(tr, file$l, 100, 10, 2411);
		},

		m: function mount(target, anchor) {
			insert(target, tr, anchor);
			append(tr, td0);
			append(tr, t1);
			append(tr, td1);
			append(td1, t2);
			append(td1, t3);
			append(td1, t4);
		},

		p: noop,

		d: function destroy(detaching) {
			if (detaching) {
				detach(tr);
			}
		}
	};
}

// (110:8) {#if variable.measure == 'scale' || variable.measure == 'ordinal'}
function create_if_block_1$2(ctx) {
	var tr, td0, t1, td1, t2_value = simpleStatistics_min.median(ctx.data), t2;

	return {
		c: function create() {
			tr = element("tr");
			td0 = element("td");
			td0.textContent = "Median:";
			t1 = space();
			td1 = element("td");
			t2 = text(t2_value);
			td0.className = "svelte-179mqmu";
			add_location(td0, file$l, 111, 12, 2741);
			td1.className = "svelte-179mqmu";
			add_location(td1, file$l, 112, 12, 2771);
			tr.className = "svelte-179mqmu";
			add_location(tr, file$l, 110, 10, 2723);
		},

		m: function mount(target, anchor) {
			insert(target, tr, anchor);
			append(tr, td0);
			append(tr, t1);
			append(tr, td1);
			append(td1, t2);
		},

		p: noop,

		d: function destroy(detaching) {
			if (detaching) {
				detach(tr);
			}
		}
	};
}

// (116:8) {#if variable.measure == 'scale'}
function create_if_block$4(ctx) {
	var tr, td0, t1, td1, t2_value = simpleStatistics_min.mean(ctx.data).toFixed(4), t2, t3, t4_value = simpleStatistics_min
                .standardDeviation(ctx.data)
                .toFixed(4), t4, t5;

	return {
		c: function create() {
			tr = element("tr");
			td0 = element("td");
			td0.textContent = "Mean:";
			t1 = space();
			td1 = element("td");
			t2 = text(t2_value);
			t3 = text(" (sd = ");
			t4 = text(t4_value);
			t5 = text(")");
			td0.className = "svelte-179mqmu";
			add_location(td0, file$l, 117, 12, 2904);
			td1.className = "svelte-179mqmu";
			add_location(td1, file$l, 118, 12, 2932);
			tr.className = "svelte-179mqmu";
			add_location(tr, file$l, 116, 10, 2886);
		},

		m: function mount(target, anchor) {
			insert(target, tr, anchor);
			append(tr, td0);
			append(tr, t1);
			append(tr, td1);
			append(td1, t2);
			append(td1, t3);
			append(td1, t4);
			append(td1, t5);
		},

		p: noop,

		d: function destroy(detaching) {
			if (detaching) {
				detach(tr);
			}
		}
	};
}

function create_fragment$l(ctx) {
	var div6, div0, t0, t1, div5, div1, t2_value = ctx.variable.variableName, t2, t3, div2, t4_value = ctx.variable.variableLabel, t4, t5, div3, t6_value = ctx.uc(ctx.variable.measure), t6, t7, t8, div4, h4, t10, table, tr0, td0, t12, td1, t13_value = ctx.data.length, t13, t14, t15, tr1, td2, t17, td3, t18_value = simpleStatistics_min.modeFast(ctx.data), t18, t19, t20, current;

	var if_block0 = (ctx.variable.measure == 'nominal') && create_if_block_5(ctx);

	var if_block1 = (ctx.variable.measure == 'scale') && create_if_block_4(ctx);

	var if_block2 = (ctx.variable.dataformat.hasOwnProperty('textChoices')) && create_if_block_3(ctx);

	var if_block3 = (ctx.variable.measure == 'scale' || ctx.variable.measure == 'ordinal') && create_if_block_2$1(ctx);

	var if_block4 = (ctx.variable.measure == 'scale' || ctx.variable.measure == 'ordinal') && create_if_block_1$2(ctx);

	var if_block5 = (ctx.variable.measure == 'scale') && create_if_block$4(ctx);

	return {
		c: function create() {
			div6 = element("div");
			div0 = element("div");
			if (if_block0) if_block0.c();
			t0 = space();
			if (if_block1) if_block1.c();
			t1 = space();
			div5 = element("div");
			div1 = element("div");
			t2 = text(t2_value);
			t3 = space();
			div2 = element("div");
			t4 = text(t4_value);
			t5 = space();
			div3 = element("div");
			t6 = text(t6_value);
			t7 = space();
			if (if_block2) if_block2.c();
			t8 = space();
			div4 = element("div");
			h4 = element("h4");
			h4.textContent = "Statistics";
			t10 = space();
			table = element("table");
			tr0 = element("tr");
			td0 = element("td");
			td0.textContent = "Count of records:";
			t12 = space();
			td1 = element("td");
			t13 = text(t13_value);
			t14 = space();
			if (if_block3) if_block3.c();
			t15 = space();
			tr1 = element("tr");
			td2 = element("td");
			td2.textContent = "Mode:";
			t17 = space();
			td3 = element("td");
			t18 = text(t18_value);
			t19 = space();
			if (if_block4) if_block4.c();
			t20 = space();
			if (if_block5) if_block5.c();
			div0.className = "charts svelte-179mqmu";
			add_location(div0, file$l, 68, 2, 1359);
			div1.className = "name";
			add_location(div1, file$l, 77, 4, 1603);
			div2.className = "label svelte-179mqmu";
			add_location(div2, file$l, 78, 4, 1656);
			div3.className = "measure svelte-179mqmu";
			add_location(div3, file$l, 79, 4, 1711);
			h4.className = "svelte-179mqmu";
			add_location(h4, file$l, 93, 6, 2169);
			td0.className = "svelte-179mqmu";
			add_location(td0, file$l, 96, 10, 2229);
			set_style(td1, "width", "20ch");
			td1.className = "svelte-179mqmu";
			add_location(td1, file$l, 97, 10, 2267);
			tr0.className = "svelte-179mqmu";
			add_location(tr0, file$l, 95, 8, 2213);
			td2.className = "svelte-179mqmu";
			add_location(td2, file$l, 106, 10, 2564);
			td3.className = "svelte-179mqmu";
			add_location(td3, file$l, 107, 10, 2590);
			tr1.className = "svelte-179mqmu";
			add_location(tr1, file$l, 105, 8, 2548);
			table.className = "svelte-179mqmu";
			add_location(table, file$l, 94, 6, 2196);
			div4.className = "stats";
			add_location(div4, file$l, 92, 4, 2142);
			div5.className = "text";
			add_location(div5, file$l, 76, 2, 1579);
			div6.className = "card svelte-179mqmu";
			add_location(div6, file$l, 67, 0, 1337);
		},

		l: function claim(nodes) {
			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
		},

		m: function mount(target, anchor) {
			insert(target, div6, anchor);
			append(div6, div0);
			if (if_block0) if_block0.m(div0, null);
			append(div0, t0);
			if (if_block1) if_block1.m(div0, null);
			append(div6, t1);
			append(div6, div5);
			append(div5, div1);
			append(div1, t2);
			append(div5, t3);
			append(div5, div2);
			append(div2, t4);
			append(div5, t5);
			append(div5, div3);
			append(div3, t6);
			append(div5, t7);
			if (if_block2) if_block2.m(div5, null);
			append(div5, t8);
			append(div5, div4);
			append(div4, h4);
			append(div4, t10);
			append(div4, table);
			append(table, tr0);
			append(tr0, td0);
			append(tr0, t12);
			append(tr0, td1);
			append(td1, t13);
			append(table, t14);
			if (if_block3) if_block3.m(table, null);
			append(table, t15);
			append(table, tr1);
			append(tr1, td2);
			append(tr1, t17);
			append(tr1, td3);
			append(td3, t18);
			append(table, t19);
			if (if_block4) if_block4.m(table, null);
			append(table, t20);
			if (if_block5) if_block5.m(table, null);
			current = true;
		},

		p: function update(changed, ctx) {
			if (ctx.variable.measure == 'nominal') {
				if (if_block0) {
					if_block0.p(changed, ctx);
					if_block0.i(1);
				} else {
					if_block0 = create_if_block_5(ctx);
					if_block0.c();
					if_block0.i(1);
					if_block0.m(div0, t0);
				}
			} else if (if_block0) {
				group_outros();
				on_outro(() => {
					if_block0.d(1);
					if_block0 = null;
				});

				if_block0.o(1);
				check_outros();
			}

			if (ctx.variable.measure == 'scale') {
				if (if_block1) {
					if_block1.p(changed, ctx);
					if_block1.i(1);
				} else {
					if_block1 = create_if_block_4(ctx);
					if_block1.c();
					if_block1.i(1);
					if_block1.m(div0, null);
				}
			} else if (if_block1) {
				group_outros();
				on_outro(() => {
					if_block1.d(1);
					if_block1 = null;
				});

				if_block1.o(1);
				check_outros();
			}

			if ((!current || changed.variable) && t2_value !== (t2_value = ctx.variable.variableName)) {
				set_data(t2, t2_value);
			}

			if ((!current || changed.variable) && t4_value !== (t4_value = ctx.variable.variableLabel)) {
				set_data(t4, t4_value);
			}

			if ((!current || changed.variable) && t6_value !== (t6_value = ctx.uc(ctx.variable.measure))) {
				set_data(t6, t6_value);
			}

			if (ctx.variable.dataformat.hasOwnProperty('textChoices')) {
				if (if_block2) {
					if_block2.p(changed, ctx);
				} else {
					if_block2 = create_if_block_3(ctx);
					if_block2.c();
					if_block2.m(div5, t8);
				}
			} else if (if_block2) {
				if_block2.d(1);
				if_block2 = null;
			}

			if (ctx.variable.measure == 'scale' || ctx.variable.measure == 'ordinal') {
				if (if_block3) {
					if_block3.p(changed, ctx);
				} else {
					if_block3 = create_if_block_2$1(ctx);
					if_block3.c();
					if_block3.m(table, t15);
				}
			} else if (if_block3) {
				if_block3.d(1);
				if_block3 = null;
			}

			if (ctx.variable.measure == 'scale' || ctx.variable.measure == 'ordinal') {
				if (if_block4) {
					if_block4.p(changed, ctx);
				} else {
					if_block4 = create_if_block_1$2(ctx);
					if_block4.c();
					if_block4.m(table, t20);
				}
			} else if (if_block4) {
				if_block4.d(1);
				if_block4 = null;
			}

			if (ctx.variable.measure == 'scale') {
				if (if_block5) {
					if_block5.p(changed, ctx);
				} else {
					if_block5 = create_if_block$4(ctx);
					if_block5.c();
					if_block5.m(table, null);
				}
			} else if (if_block5) {
				if_block5.d(1);
				if_block5 = null;
			}
		},

		i: function intro(local) {
			if (current) return;
			if (if_block0) if_block0.i();
			if (if_block1) if_block1.i();
			current = true;
		},

		o: function outro(local) {
			if (if_block0) if_block0.o();
			if (if_block1) if_block1.o();
			current = false;
		},

		d: function destroy(detaching) {
			if (detaching) {
				detach(div6);
			}

			if (if_block0) if_block0.d();
			if (if_block1) if_block1.d();
			if (if_block2) if_block2.d();
			if (if_block3) if_block3.d();
			if (if_block4) if_block4.d();
			if (if_block5) if_block5.d();
		}
	};
}

function instance$i($$self, $$props, $$invalidate) {
	

  let { variable = {} } = $$props;
  // helper functions
  const uc = str => str.charAt(0).toUpperCase() + str.slice(1);

  // get answer results for this variable
  const data = variable.results.map(v => v.value);

	const writable_props = ['variable'];
	Object.keys($$props).forEach(key => {
		if (!writable_props.includes(key) && !key.startsWith('$$')) console.warn(`<VariableStats> was created with unknown prop '${key}'`);
	});

	$$self.$set = $$props => {
		if ('variable' in $$props) $$invalidate('variable', variable = $$props.variable);
	};

	return { variable, uc, data };
}

class VariableStats extends SvelteComponentDev {
	constructor(options) {
		super(options);
		init(this, options, instance$i, create_fragment$l, safe_not_equal, ["variable"]);
	}

	get variable() {
		throw new Error("<VariableStats>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set variable(value) {
		throw new Error("<VariableStats>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}
}

/* src\pages\Descriptives.svelte generated by Svelte v3.5.1 */

const file$m = "src\\pages\\Descriptives.svelte";

function get_each_context$6(ctx, list, i) {
	const child_ctx = Object.create(ctx);
	child_ctx.variable = list[i];
	return child_ctx;
}

// (1:0) <script>    import { db }
function create_catch_block$1(ctx) {
	return {
		c: noop,
		m: noop,
		p: noop,
		i: noop,
		o: noop,
		d: noop
	};
}

// (44:2) {:then studyId}
function create_then_block$1(ctx) {
	var each_1_anchor, current;

	function func(...args) {
		return ctx.func(ctx, ...args);
	}

	var each_value = ctx.$variableStore.filter(func);

	var each_blocks = [];

	for (var i = 0; i < each_value.length; i += 1) {
		each_blocks[i] = create_each_block$6(get_each_context$6(ctx, each_value, i));
	}

	function outro_block(i, detaching, local) {
		if (each_blocks[i]) {
			if (detaching) {
				on_outro(() => {
					each_blocks[i].d(detaching);
					each_blocks[i] = null;
				});
			}

			each_blocks[i].o(local);
		}
	}

	return {
		c: function create() {
			for (var i = 0; i < each_blocks.length; i += 1) {
				each_blocks[i].c();
			}

			each_1_anchor = empty();
		},

		m: function mount(target, anchor) {
			for (var i = 0; i < each_blocks.length; i += 1) {
				each_blocks[i].m(target, anchor);
			}

			insert(target, each_1_anchor, anchor);
			current = true;
		},

		p: function update(changed, new_ctx) {
			ctx = new_ctx;
			if (changed.$variableStore) {
				each_value = ctx.$variableStore.filter(func);

				for (var i = 0; i < each_value.length; i += 1) {
					const child_ctx = get_each_context$6(ctx, each_value, i);

					if (each_blocks[i]) {
						each_blocks[i].p(changed, child_ctx);
						each_blocks[i].i(1);
					} else {
						each_blocks[i] = create_each_block$6(child_ctx);
						each_blocks[i].c();
						each_blocks[i].i(1);
						each_blocks[i].m(each_1_anchor.parentNode, each_1_anchor);
					}
				}

				group_outros();
				for (; i < each_blocks.length; i += 1) outro_block(i, 1, 1);
				check_outros();
			}
		},

		i: function intro(local) {
			if (current) return;
			for (var i = 0; i < each_value.length; i += 1) each_blocks[i].i();

			current = true;
		},

		o: function outro(local) {
			each_blocks = each_blocks.filter(Boolean);
			for (let i = 0; i < each_blocks.length; i += 1) outro_block(i, 0, 0);

			current = false;
		},

		d: function destroy(detaching) {
			destroy_each(each_blocks, detaching);

			if (detaching) {
				detach(each_1_anchor);
			}
		}
	};
}

// (45:4) {#each $variableStore.filter(v => v.studyId === studyId) as variable}
function create_each_block$6(ctx) {
	var current;

	var varstats = new VariableStats({
		props: { variable: ctx.variable },
		$$inline: true
	});

	return {
		c: function create() {
			varstats.$$.fragment.c();
		},

		m: function mount(target, anchor) {
			mount_component(varstats, target, anchor);
			current = true;
		},

		p: function update(changed, ctx) {
			var varstats_changes = {};
			if (changed.$variableStore) varstats_changes.variable = ctx.variable;
			varstats.$set(varstats_changes);
		},

		i: function intro(local) {
			if (current) return;
			varstats.$$.fragment.i(local);

			current = true;
		},

		o: function outro(local) {
			varstats.$$.fragment.o(local);
			current = false;
		},

		d: function destroy(detaching) {
			varstats.$destroy(detaching);
		}
	};
}

// (40:25)       <div class="spinner">        <img src="loading.svg" alt="loading page" />      </div>    {:then studyId}
function create_pending_block$1(ctx) {
	var div, img;

	return {
		c: function create() {
			div = element("div");
			img = element("img");
			img.src = "loading.svg";
			img.alt = "loading page";
			img.className = "svelte-n0z62j";
			add_location(img, file$m, 41, 6, 1078);
			div.className = "spinner svelte-n0z62j";
			add_location(div, file$m, 40, 4, 1049);
		},

		m: function mount(target, anchor) {
			insert(target, div, anchor);
			append(div, img);
		},

		p: noop,
		i: noop,
		o: noop,

		d: function destroy(detaching) {
			if (detaching) {
				detach(div);
			}
		}
	};
}

function create_fragment$m(ctx) {
	var div, promise, div_intro, current;

	let info = {
		ctx,
		current: null,
		pending: create_pending_block$1,
		then: create_then_block$1,
		catch: create_catch_block$1,
		value: 'studyId',
		error: 'null',
		blocks: Array(3)
	};

	handle_promise(promise = ctx.studyIdPromise, info);

	return {
		c: function create() {
			div = element("div");

			info.block.c();
			div.className = "container svelte-n0z62j";
			add_location(div, file$m, 38, 0, 965);
		},

		l: function claim(nodes) {
			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
		},

		m: function mount(target, anchor) {
			insert(target, div, anchor);

			info.block.m(div, info.anchor = null);
			info.mount = () => div;
			info.anchor = null;

			current = true;
		},

		p: function update(changed, new_ctx) {
			ctx = new_ctx;
			info.ctx = ctx;

			if (promise !== (promise = ctx.studyIdPromise) && handle_promise(promise, info)) ; else {
				info.block.p(changed, assign(assign({}, ctx), info.resolved));
			}
		},

		i: function intro(local) {
			if (current) return;
			info.block.i();

			if (!div_intro) {
				add_render_callback(() => {
					div_intro = create_in_transition(div, fade, { duration: 300 });
					div_intro.start();
				});
			}

			current = true;
		},

		o: function outro(local) {
			for (let i = 0; i < 3; i += 1) {
				const block = info.blocks[i];
				if (block) block.o();
			}

			current = false;
		},

		d: function destroy(detaching) {
			if (detaching) {
				detach(div);
			}

			info.block.d();
			info = null;
		}
	};
}

function instance$j($$self, $$props, $$invalidate) {
	let $variableStore;

	validate_store(variableStore, 'variableStore');
	subscribe($$self, variableStore, $$value => { $variableStore = $$value; $$invalidate('$variableStore', $variableStore); });

	

  let { studyId = 0 } = $$props;
  // FIXME: always selects first study since tab nav does not work dynamically yet
  const studyIdPromise = new Promise((resolve, rej) => {
    const tx = db.transaction("Studies");
    tx.objectStore("Studies").getAll().onsuccess = e => {
      const studies = e.target.result;
      resolve(studies[0]._id);
    };
  });

	const writable_props = ['studyId'];
	Object.keys($$props).forEach(key => {
		if (!writable_props.includes(key) && !key.startsWith('$$')) console.warn(`<Descriptives> was created with unknown prop '${key}'`);
	});

	function func({ studyId }, v) {
		return v.studyId === studyId;
	}

	$$self.$set = $$props => {
		if ('studyId' in $$props) $$invalidate('studyId', studyId = $$props.studyId);
	};

	return {
		studyId,
		studyIdPromise,
		$variableStore,
		func
	};
}

class Descriptives extends SvelteComponentDev {
	constructor(options) {
		super(options);
		init(this, options, instance$j, create_fragment$m, safe_not_equal, ["studyId"]);
	}

	get studyId() {
		throw new Error("<Descriptives>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set studyId(value) {
		throw new Error("<Descriptives>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}
}

/* src\SensQVis.svelte generated by Svelte v3.5.1 */

const file$n = "src\\SensQVis.svelte";

// (89:33) 
function create_if_block_3$1(ctx) {
	var current;

	var descriptives = new Descriptives({ $$inline: true });

	return {
		c: function create() {
			descriptives.$$.fragment.c();
		},

		m: function mount(target, anchor) {
			mount_component(descriptives, target, anchor);
			current = true;
		},

		i: function intro(local) {
			if (current) return;
			descriptives.$$.fragment.i(local);

			current = true;
		},

		o: function outro(local) {
			descriptives.$$.fragment.o(local);
			current = false;
		},

		d: function destroy(detaching) {
			descriptives.$destroy(detaching);
		}
	};
}

// (87:33) 
function create_if_block_2$2(ctx) {
	var current;

	var userview = new Userview({ $$inline: true });

	return {
		c: function create() {
			userview.$$.fragment.c();
		},

		m: function mount(target, anchor) {
			mount_component(userview, target, anchor);
			current = true;
		},

		i: function intro(local) {
			if (current) return;
			userview.$$.fragment.i(local);

			current = true;
		},

		o: function outro(local) {
			userview.$$.fragment.o(local);
			current = false;
		},

		d: function destroy(detaching) {
			userview.$destroy(detaching);
		}
	};
}

// (85:33) 
function create_if_block_1$3(ctx) {
	var current;

	var overview = new Overview({ $$inline: true });

	return {
		c: function create() {
			overview.$$.fragment.c();
		},

		m: function mount(target, anchor) {
			mount_component(overview, target, anchor);
			current = true;
		},

		i: function intro(local) {
			if (current) return;
			overview.$$.fragment.i(local);

			current = true;
		},

		o: function outro(local) {
			overview.$$.fragment.o(local);
			current = false;
		},

		d: function destroy(detaching) {
			overview.$destroy(detaching);
		}
	};
}

// (83:4) {#if $activeUITab === 0}
function create_if_block$5(ctx) {
	var current;

	var studies = new StudyList({ $$inline: true });

	return {
		c: function create() {
			studies.$$.fragment.c();
		},

		m: function mount(target, anchor) {
			mount_component(studies, target, anchor);
			current = true;
		},

		i: function intro(local) {
			if (current) return;
			studies.$$.fragment.i(local);

			current = true;
		},

		o: function outro(local) {
			studies.$$.fragment.o(local);
			current = false;
		},

		d: function destroy(detaching) {
			studies.$destroy(detaching);
		}
	};
}

function create_fragment$n(ctx) {
	var main, header, t0, nav, div0, t1, div1, t2, section, current_block_type_index, if_block, current;

	var studyinfo = new StudyInfo({ $$inline: true });

	var tabs = new Tabs({ $$inline: true });

	var undoredo = new UndoRedo({ $$inline: true });

	var if_block_creators = [
		create_if_block$5,
		create_if_block_1$3,
		create_if_block_2$2,
		create_if_block_3$1
	];

	var if_blocks = [];

	function select_block_type(ctx) {
		if (ctx.$activeUITab === 0) return 0;
		if (ctx.$activeUITab === 1) return 1;
		if (ctx.$activeUITab === 2) return 2;
		if (ctx.$activeUITab === 3) return 3;
		return -1;
	}

	if (~(current_block_type_index = select_block_type(ctx))) {
		if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
	}

	return {
		c: function create() {
			main = element("main");
			header = element("header");
			studyinfo.$$.fragment.c();
			t0 = space();
			nav = element("nav");
			div0 = element("div");
			tabs.$$.fragment.c();
			t1 = space();
			div1 = element("div");
			undoredo.$$.fragment.c();
			t2 = space();
			section = element("section");
			if (if_block) if_block.c();
			header.className = "svelte-1upxu8k";
			add_location(header, file$n, 70, 2, 1590);
			div0.className = "tabs svelte-1upxu8k";
			add_location(div0, file$n, 74, 4, 1645);
			div1.className = "undoRedo svelte-1upxu8k";
			add_location(div1, file$n, 77, 4, 1697);
			nav.className = "svelte-1upxu8k";
			add_location(nav, file$n, 73, 2, 1634);
			section.className = "svelte-1upxu8k";
			add_location(section, file$n, 81, 2, 1765);
			main.className = "svelte-1upxu8k";
			add_location(main, file$n, 69, 0, 1580);
		},

		l: function claim(nodes) {
			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
		},

		m: function mount(target, anchor) {
			insert(target, main, anchor);
			append(main, header);
			mount_component(studyinfo, header, null);
			append(main, t0);
			append(main, nav);
			append(nav, div0);
			mount_component(tabs, div0, null);
			append(nav, t1);
			append(nav, div1);
			mount_component(undoredo, div1, null);
			append(main, t2);
			append(main, section);
			if (~current_block_type_index) if_blocks[current_block_type_index].m(section, null);
			current = true;
		},

		p: function update(changed, ctx) {
			var previous_block_index = current_block_type_index;
			current_block_type_index = select_block_type(ctx);
			if (current_block_type_index !== previous_block_index) {
				if (if_block) {
					group_outros();
					on_outro(() => {
						if_blocks[previous_block_index].d(1);
						if_blocks[previous_block_index] = null;
					});
					if_block.o(1);
					check_outros();
				}

				if (~current_block_type_index) {
					if_block = if_blocks[current_block_type_index];
					if (!if_block) {
						if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
						if_block.c();
					}
					if_block.i(1);
					if_block.m(section, null);
				} else {
					if_block = null;
				}
			}
		},

		i: function intro(local) {
			if (current) return;
			studyinfo.$$.fragment.i(local);

			tabs.$$.fragment.i(local);

			undoredo.$$.fragment.i(local);

			if (if_block) if_block.i();
			current = true;
		},

		o: function outro(local) {
			studyinfo.$$.fragment.o(local);
			tabs.$$.fragment.o(local);
			undoredo.$$.fragment.o(local);
			if (if_block) if_block.o();
			current = false;
		},

		d: function destroy(detaching) {
			if (detaching) {
				detach(main);
			}

			studyinfo.$destroy();

			tabs.$destroy();

			undoredo.$destroy();

			if (~current_block_type_index) if_blocks[current_block_type_index].d();
		}
	};
}

function instance$k($$self, $$props, $$invalidate) {
	let $activeUITab;

	validate_store(activeUITab, 'activeUITab');
	subscribe($$self, activeUITab, $$value => { $activeUITab = $$value; $$invalidate('$activeUITab', $activeUITab); });

	return { $activeUITab };
}

class SensQVis extends SvelteComponentDev {
	constructor(options) {
		super(options);
		init(this, options, instance$k, create_fragment$n, safe_not_equal, []);
	}
}

const app = new SensQVis({
	target: document.body,
});

export default app;
//# sourceMappingURL=bundle.js.map
