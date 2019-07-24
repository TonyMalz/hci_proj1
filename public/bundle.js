
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
let raf = cb => requestAnimationFrame(cb);

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
function prevent_default(fn) {
    return function (event) {
        event.preventDefault();
        // @ts-ignore
        return fn.call(this, event);
    };
}
function stop_propagation(fn) {
    return function (event) {
        event.stopPropagation();
        // @ts-ignore
        return fn.call(this, event);
    };
}
function attr(node, attribute, value) {
    if (value == null)
        node.removeAttribute(attribute);
    else
        node.setAttribute(attribute, value);
}
function get_binding_group_value(group) {
    const value = [];
    for (let i = 0; i < group.length; i += 1) {
        if (group[i].checked)
            value.push(group[i].__value);
    }
    return value;
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
function select_option(select, value) {
    for (let i = 0; i < select.options.length; i += 1) {
        const option = select.options[i];
        if (option.__value === value) {
            option.selected = true;
            return;
        }
    }
}
function select_value(select) {
    const selected_option = select.querySelector(':checked') || select.options[0];
    return selected_option && selected_option.__value;
}
function toggle_class(element, name, toggle) {
    element.classList[toggle ? 'add' : 'remove'](name);
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
    loop(now => {
        if (!started && now >= start_time) {
            started = true;
        }
        if (started && now >= end) {
            tick(1, 0);
            stop();
        }
        if (!running) {
            return false;
        }
        if (started) {
            const p = now - start_time;
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
const binding_callbacks = [];
const render_callbacks = [];
const flush_callbacks = [];
const resolved_promise = Promise.resolve();
let update_scheduled = false;
function schedule_update() {
    if (!update_scheduled) {
        update_scheduled = true;
        resolved_promise.then(flush);
    }
}
function tick() {
    schedule_update();
    return resolved_promise;
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
            binding_callbacks.pop()();
        // then, once components are updated, call
        // afterUpdate functions. This may cause
        // subsequent updates...
        for (let i = 0; i < render_callbacks.length; i += 1) {
            const callback = render_callbacks[i];
            if (!seen_callbacks.has(callback)) {
                callback();
                // ...so guard against infinite loops
                seen_callbacks.add(callback);
            }
        }
        render_callbacks.length = 0;
    } while (dirty_components.length);
    while (flush_callbacks.length) {
        flush_callbacks.pop()();
    }
    update_scheduled = false;
}
function update($$) {
    if ($$.fragment) {
        $$.update($$.dirty);
        run_all($$.before_update);
        $$.fragment.p($$.dirty, $$.ctx);
        $$.dirty = null;
        $$.after_update.forEach(add_render_callback);
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
const outroing = new Set();
let outros;
function group_outros() {
    outros = {
        r: 0,
        c: [],
        p: outros // parent group
    };
}
function check_outros() {
    if (!outros.r) {
        run_all(outros.c);
    }
    outros = outros.p;
}
function transition_in(block, local) {
    if (block && block.i) {
        outroing.delete(block);
        block.i(local);
    }
}
function transition_out(block, local, detach, callback) {
    if (block && block.o) {
        if (outroing.has(block))
            return;
        outroing.add(block);
        outros.c.push(() => {
            outroing.delete(block);
            if (callback) {
                if (detach)
                    block.d(1);
                callback();
            }
        });
        block.o(local);
    }
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
        const { delay = 0, duration = 300, easing = identity, tick = noop, css } = config;
        if (css)
            animation_name = create_rule(node, 0, 1, duration, delay, easing, css, uid++);
        tick(0, 1);
        const start_time = now() + delay;
        const end_time = start_time + duration;
        if (task)
            task.abort();
        running = true;
        add_render_callback(() => dispatch(node, true, 'start'));
        task = loop(now => {
            if (running) {
                if (now >= end_time) {
                    tick(1, 0);
                    dispatch(node, true, 'end');
                    cleanup();
                    return running = false;
                }
                if (now >= start_time) {
                    const t = easing((now - start_time) / duration);
                    tick(t, 1 - t);
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
        const { delay = 0, duration = 300, easing = identity, tick = noop, css } = config;
        const program = {
            start: now() + delay,
            b
        };
        if (!b) {
            // @ts-ignore todo: improve typings
            program.group = outros;
            outros.r += 1;
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
                tick(0, 1);
            running_program = init(program, duration);
            add_render_callback(() => dispatch(node, b, 'start'));
            loop(now => {
                if (pending_program && now > pending_program.start) {
                    running_program = init(pending_program, duration);
                    pending_program = null;
                    dispatch(node, running_program.b, 'start');
                    if (css) {
                        clear_animation();
                        animation_name = create_rule(node, t, running_program.b, running_program.duration, 0, easing, config.css);
                    }
                }
                if (running_program) {
                    if (now >= running_program.end) {
                        tick(t = running_program.b, 1 - t);
                        dispatch(node, running_program.b, 'end');
                        if (!pending_program) {
                            // we're done
                            if (running_program.b) {
                                // intro — we can tidy up immediately
                                clear_animation();
                            }
                            else {
                                // outro — needs to be coordinated
                                if (!--running_program.group.r)
                                    run_all(running_program.group.c);
                            }
                        }
                        running_program = null;
                    }
                    else if (now >= running_program.start) {
                        const p = now - running_program.start;
                        t = running_program.a + running_program.d * easing(p / running_program.duration);
                        tick(t, 1 - t);
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
                        transition_out(block, 1, 1, () => {
                            info.blocks[i] = null;
                        });
                        check_outros();
                    }
                });
            }
            else {
                info.block.d(1);
            }
            block.c();
            transition_in(block, 1);
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

const globals = (typeof window !== 'undefined' ? window : global);
function outro_and_destroy_block(block, lookup) {
    transition_out(block, 1, 1, () => {
        lookup.delete(block.key);
    });
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
        transition_in(block, 1);
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
    const { fragment, on_mount, on_destroy, after_update } = component.$$;
    fragment.m(target, anchor);
    // onMount happens before the initial afterUpdate
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
    after_update.forEach(add_render_callback);
}
function destroy_component(component, detaching) {
    if (component.$$.fragment) {
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
function init(component, options, instance, create_fragment, not_equal, prop_names) {
    const parent_component = current_component;
    set_current_component(component);
    const props = options.props || {};
    const $$ = component.$$ = {
        fragment: null,
        ctx: null,
        // state
        props: prop_names,
        update: noop,
        not_equal,
        bound: blank_object(),
        // lifecycle
        on_mount: [],
        on_destroy: [],
        before_update: [],
        after_update: [],
        context: new Map(parent_component ? parent_component.$$.context : []),
        // everything else
        callbacks: blank_object(),
        dirty: null
    };
    let ready = false;
    $$.ctx = instance
        ? instance(component, props, (key, value) => {
            if ($$.ctx && not_equal($$.ctx[key], $$.ctx[key] = value)) {
                if ($$.bound[key])
                    $$.bound[key](value);
                if (ready)
                    make_dirty(component, key);
            }
        })
        : props;
    $$.update();
    ready = true;
    run_all($$.before_update);
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
        if (options.intro)
            transition_in(component.$$.fragment);
        mount_component(component, options.target, options.anchor);
        flush();
    }
    set_current_component(parent_component);
}
class SvelteComponent {
    $destroy() {
        destroy_component(this, 1);
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

/* src\components\TabItem.svelte generated by Svelte v3.6.7 */

const file = "src\\components\\TabItem.svelte";

// (28:0) {:else}
function create_else_block(ctx) {
	var div, t_value = ctx.tab.title, t, dispose;

	return {
		c: function create() {
			div = element("div");
			t = text(t_value);
			attr(div, "class", "svelte-1av4as1");
			add_location(div, file, 28, 2, 545);
			dispose = listen(div, "click", ctx.toggleEdit);
		},

		m: function mount(target, anchor) {
			insert(target, div, anchor);
			append(div, t);
		},

		p: function update_1(changed, ctx) {
			if ((changed.tab) && t_value !== (t_value = ctx.tab.title)) {
				set_data(t, t_value);
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

			input.value = ctx.tab.title;

			input.focus();
		},

		p: function update_1(changed, ctx) {
			if (changed.tab && (input.value !== ctx.tab.title)) input.value = ctx.tab.title;
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
	let { tab } = $$props;
  let toggle = false;
  function toggleEdit() {
    if (tab.type === "home") return;
    $$invalidate('toggle', toggle = !toggle);
  }

  const dispatch = createEventDispatcher();
  function update() {
    toggleEdit();
    dispatch("notify", tab);
  }

	const writable_props = ['tab'];
	Object.keys($$props).forEach(key => {
		if (!writable_props.includes(key) && !key.startsWith('$$')) console.warn(`<TabItem> was created with unknown prop '${key}'`);
	});

	function input_input_handler() {
		tab.title = this.value;
		$$invalidate('tab', tab);
	}

	$$self.$set = $$props => {
		if ('tab' in $$props) $$invalidate('tab', tab = $$props.tab);
	};

	return {
		tab,
		toggle,
		toggleEdit,
		update,
		input_input_handler
	};
}

class TabItem extends SvelteComponentDev {
	constructor(options) {
		super(options);
		init(this, options, instance, create_fragment, safe_not_equal, ["tab"]);

		const { ctx } = this.$$;
		const props = options.props || {};
		if (ctx.tab === undefined && !('tab' in props)) {
			console.warn("<TabItem> was created without expected prop 'tab'");
		}
	}

	get tab() {
		throw new Error("<TabItem>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set tab(value) {
		throw new Error("<TabItem>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
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
                stop = null;
            }
        };
    }
    return { set, update, subscribe };
}

const studyStore = writable([]);
const variableStore = writable([]);
const tabStore = writable([{ title: "Home", type: "home", studyId: null }]);
const msgStore = writable([]);
const responseStore = writable([]);
const userStore = writable([]);
const activeTabIdx = writable(0);

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

    // used to store opened UI Tabs
    store = db.createObjectStore("UITabs", { keyPath: "id" });
    // types: home, overview, detailview, descriptives, customview
    store.put({ title: "Home", type: "home", studyId: null, id: 0 });
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
    db.transaction("UITabs").objectStore("UITabs").getAll().onsuccess = e => {
        tabStore.set(e.target.result);
    };
    db.transaction("StudyResponses").objectStore("StudyResponses").getAll().onsuccess = e => {
        responseStore.set(e.target.result);
    };
    db.transaction("Users").objectStore("Users").getAll().onsuccess = e => {
        userStore.set(e.target.result);
    };
};

function formatDate(date, showtime = true, abbr = true) {
    if (!(date instanceof Date)) {
        date = new Date(date);
    }
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

    if (diffMs < 0 || abbr === false) {
        return showtime ? `${dayOfMonth}.${month}.'${year} ${hour}:${minutes}` : `${dayOfMonth}.${month}.'${year}`
    }
    if (diffSec < 1) {
        return 'right now';
    } else if (diffMin < 1) {
        return `${diffSec.toFixed()} sec. ago`
    } else if (diffHour < 1) {
        return `${diffMin.toFixed()} min. ago`
    } else {
        return showtime ? `${dayOfMonth}.${month}.'${year} ${hour}:${minutes}` : `${dayOfMonth}.${month}.'${year}`
    }
}

const uc = str => str.charAt(0).toUpperCase() + str.slice(1);
const trunc = (t, n = 10) => t.substr(0, n - 1) + (t.length > n ? "..." : "");
function downloadAsJson(exportObj, exportName) {
    var dataStr =
        "data:text/json;charset=utf-8," +
        encodeURIComponent(JSON.stringify(exportObj));
    var da = document.createElement("a");
    da.setAttribute("href", dataStr);
    da.setAttribute("download", exportName + ".json");
    document.body.appendChild(da); // required for firefox
    da.click();
    da.remove();
}

/* src\components\TabNavigation.svelte generated by Svelte v3.6.7 */

const file$1 = "src\\components\\TabNavigation.svelte";

function get_each_context(ctx, list, i) {
	const child_ctx = Object.create(ctx);
	child_ctx.tab = list[i];
	child_ctx.idx = i;
	return child_ctx;
}

// (242:4) {:else}
function create_else_block$1(ctx) {
	var li, t, current;

	var tabitem = new TabItem({
		props: { tab: ctx.tab },
		$$inline: true
	});
	tabitem.$on("notify", titleChanged);

	var if_block = (ctx.idx !== 0) && create_if_block_2(ctx);

	return {
		c: function create() {
			li = element("li");
			tabitem.$$.fragment.c();
			t = space();
			if (if_block) if_block.c();
			attr(li, "class", "active svelte-lb0mha");
			add_location(li, file$1, 242, 6, 6954);
		},

		m: function mount(target, anchor) {
			insert(target, li, anchor);
			mount_component(tabitem, li, null);
			append(li, t);
			if (if_block) if_block.m(li, null);
			current = true;
		},

		p: function update(changed, ctx) {
			var tabitem_changes = {};
			if (changed.$tabStore) tabitem_changes.tab = ctx.tab;
			tabitem.$set(tabitem_changes);

			if (ctx.idx !== 0) {
				if (!if_block) {
					if_block = create_if_block_2(ctx);
					if_block.c();
					if_block.m(li, null);
				}
			} else if (if_block) {
				if_block.d(1);
				if_block = null;
			}
		},

		i: function intro(local) {
			if (current) return;
			transition_in(tabitem.$$.fragment, local);

			current = true;
		},

		o: function outro(local) {
			transition_out(tabitem.$$.fragment, local);
			current = false;
		},

		d: function destroy(detaching) {
			if (detaching) {
				detach(li);
			}

			destroy_component(tabitem, );

			if (if_block) if_block.d();
		}
	};
}

// (231:4) {#if idx !== $activeTabIdx}
function create_if_block$1(ctx) {
	var li, t, current, dispose;

	var tabitem = new TabItem({
		props: { tab: ctx.tab },
		$$inline: true
	});

	var if_block = (ctx.idx !== 0) && create_if_block_1(ctx);

	function click_handler_1() {
		return ctx.click_handler_1(ctx);
	}

	return {
		c: function create() {
			li = element("li");
			tabitem.$$.fragment.c();
			t = space();
			if (if_block) if_block.c();
			attr(li, "class", "svelte-lb0mha");
			add_location(li, file$1, 231, 6, 6661);
			dispose = listen(li, "click", click_handler_1);
		},

		m: function mount(target, anchor) {
			insert(target, li, anchor);
			mount_component(tabitem, li, null);
			append(li, t);
			if (if_block) if_block.m(li, null);
			current = true;
		},

		p: function update(changed, new_ctx) {
			ctx = new_ctx;
			var tabitem_changes = {};
			if (changed.$tabStore) tabitem_changes.tab = ctx.tab;
			tabitem.$set(tabitem_changes);

			if (ctx.idx !== 0) {
				if (!if_block) {
					if_block = create_if_block_1(ctx);
					if_block.c();
					if_block.m(li, null);
				}
			} else if (if_block) {
				if_block.d(1);
				if_block = null;
			}
		},

		i: function intro(local) {
			if (current) return;
			transition_in(tabitem.$$.fragment, local);

			current = true;
		},

		o: function outro(local) {
			transition_out(tabitem.$$.fragment, local);
			current = false;
		},

		d: function destroy(detaching) {
			if (detaching) {
				detach(li);
			}

			destroy_component(tabitem, );

			if (if_block) if_block.d();
			dispose();
		}
	};
}

// (245:8) {#if idx !== 0}
function create_if_block_2(ctx) {
	var div, dispose;

	function click_handler_2() {
		return ctx.click_handler_2(ctx);
	}

	return {
		c: function create() {
			div = element("div");
			div.textContent = "x";
			attr(div, "class", "close svelte-lb0mha");
			add_location(div, file$1, 245, 10, 7062);
			dispose = listen(div, "click", stop_propagation(prevent_default(click_handler_2)));
		},

		m: function mount(target, anchor) {
			insert(target, div, anchor);
		},

		p: function update(changed, new_ctx) {
			ctx = new_ctx;
		},

		d: function destroy(detaching) {
			if (detaching) {
				detach(div);
			}

			dispose();
		}
	};
}

// (234:8) {#if idx !== 0}
function create_if_block_1(ctx) {
	var div, dispose;

	function click_handler() {
		return ctx.click_handler(ctx);
	}

	return {
		c: function create() {
			div = element("div");
			div.textContent = "x";
			attr(div, "class", "close svelte-lb0mha");
			add_location(div, file$1, 234, 10, 6763);
			dispose = listen(div, "click", stop_propagation(prevent_default(click_handler)));
		},

		m: function mount(target, anchor) {
			insert(target, div, anchor);
		},

		p: function update(changed, new_ctx) {
			ctx = new_ctx;
		},

		d: function destroy(detaching) {
			if (detaching) {
				detach(div);
			}

			dispose();
		}
	};
}

// (230:2) {#each $tabStore as tab, idx}
function create_each_block(ctx) {
	var current_block_type_index, if_block, if_block_anchor, current;

	var if_block_creators = [
		create_if_block$1,
		create_else_block$1
	];

	var if_blocks = [];

	function select_block_type(ctx) {
		if (ctx.idx !== ctx.$activeTabIdx) return 0;
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
				transition_out(if_blocks[previous_block_index], 1, 1, () => {
					if_blocks[previous_block_index] = null;
				});
				check_outros();

				if_block = if_blocks[current_block_type_index];
				if (!if_block) {
					if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
					if_block.c();
				}
				transition_in(if_block, 1);
				if_block.m(if_block_anchor.parentNode, if_block_anchor);
			}
		},

		i: function intro(local) {
			if (current) return;
			transition_in(if_block);
			current = true;
		},

		o: function outro(local) {
			transition_out(if_block);
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

function create_fragment$1(ctx) {
	var ul, t, li, div, current, dispose;

	var each_value = ctx.$tabStore;

	var each_blocks = [];

	for (var i = 0; i < each_value.length; i += 1) {
		each_blocks[i] = create_each_block(get_each_context(ctx, each_value, i));
	}

	const out = i => transition_out(each_blocks[i], 1, 1, () => {
		each_blocks[i] = null;
	});

	return {
		c: function create() {
			ul = element("ul");

			for (var i = 0; i < each_blocks.length; i += 1) {
				each_blocks[i].c();
			}

			t = space();
			li = element("li");
			div = element("div");
			div.textContent = "+";
			attr(div, "class", "svelte-lb0mha");
			add_location(div, file$1, 255, 4, 7268);
			attr(li, "class", "svelte-lb0mha");
			add_location(li, file$1, 254, 2, 7258);
			attr(ul, "class", "svelte-lb0mha");
			add_location(ul, file$1, 228, 0, 6583);
			dispose = listen(div, "click", ctx.addCustomTab);
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
			append(li, div);
			current = true;
		},

		p: function update(changed, ctx) {
			if (changed.$activeTabIdx || changed.$tabStore) {
				each_value = ctx.$tabStore;

				for (var i = 0; i < each_value.length; i += 1) {
					const child_ctx = get_each_context(ctx, each_value, i);

					if (each_blocks[i]) {
						each_blocks[i].p(changed, child_ctx);
						transition_in(each_blocks[i], 1);
					} else {
						each_blocks[i] = create_each_block(child_ctx);
						each_blocks[i].c();
						transition_in(each_blocks[i], 1);
						each_blocks[i].m(ul, t);
					}
				}

				group_outros();
				for (i = each_value.length; i < each_blocks.length; i += 1) out(i);
				check_outros();
			}
		},

		i: function intro(local) {
			if (current) return;
			for (var i = 0; i < each_value.length; i += 1) transition_in(each_blocks[i]);

			current = true;
		},

		o: function outro(local) {
			each_blocks = each_blocks.filter(Boolean);
			for (let i = 0; i < each_blocks.length; i += 1) transition_out(each_blocks[i]);

			current = false;
		},

		d: function destroy(detaching) {
			if (detaching) {
				detach(ul);
			}

			destroy_each(each_blocks, detaching);

			dispose();
		}
	};
}

async function updateTabStore(newTabs) {
  await tick();
  const store = db.transaction("UITabs", "readwrite").objectStore("UITabs");
  store.clear();
  for (const tab of newTabs) {
    store.put(tab);
  }
}

function titleChanged(event) {
  console.log("titlechanged");
  const tab = event.detail;
  db.transaction("UITabs", "readwrite")
    .objectStore("UITabs")
    .put(tab);
}

function instance$1($$self, $$props, $$invalidate) {
	let $msgStore, $tabStore, $activeTabIdx;

	validate_store(msgStore, 'msgStore');
	subscribe($$self, msgStore, $$value => { $msgStore = $$value; $$invalidate('$msgStore', $msgStore); });
	validate_store(tabStore, 'tabStore');
	subscribe($$self, tabStore, $$value => { $tabStore = $$value; $$invalidate('$tabStore', $tabStore); });
	validate_store(activeTabIdx, 'activeTabIdx');
	subscribe($$self, activeTabIdx, $$value => { $activeTabIdx = $$value; $$invalidate('$activeTabIdx', $activeTabIdx); });

	

  function handleMsgs(messages) {
    for (const { action, data: study } of messages) {
      console.log(action, study);
      switch (action) {
        case "openStudyTabs":
          //check if tabs for this study already exist
          let studyTabs = $tabStore.filter(v => v.studyId === study._id);
          const studyName = trunc(study.studyName, 25);
          if (studyTabs.length < 1) {
            console.log("create new tabs", studyTabs);
            // tabs don't exist yet create new ones
            const newTabs = [];
            // add home
            newTabs.push($tabStore[0]);
            // show and activate 1st study tab, since it's not already shown
            newTabs.push({
              title: "Descriptives " + studyName,
              type: "descriptives",
              studyId: study._id,
              id: 1
            });
            newTabs.push({
              title: "Overview " + studyName,
              type: "overview",
              studyId: study._id,
              id: 2
            });
            newTabs.push({
              title: "User view " + studyName,
              type: "userview",
              studyId: study._id,
              id: 3
            });

            let id = 4;
            //add the rest of the tabs
            for (const tab of $tabStore.slice(1)) {
              tab.id = id++;
              newTabs.push(tab);
            }
            $tabStore = newTabs; tabStore.set($tabStore);
            updateTabStore(newTabs);
            // activate newly created second tab
            $activeTabIdx = 1; activeTabIdx.set($activeTabIdx);
          } else if (studyTabs.length == 3) {
            // activate 1st tab of this study
            for (const tab of studyTabs) {
              if (tab.type === "descriptives") {
                $activeTabIdx = tab.id; activeTabIdx.set($activeTabIdx);
                return;
              }
            }
          } else {
            const types = ["descriptives", "overview", "userview"];
            const currentTypes = studyTabs.map(v => v.type);
            const missingTypes = types.filter(
              type => !currentTypes.includes(type)
            );

            const newTabs = [];
            let id = 0;
            // add current tabs
            for (const currentTab of $tabStore) {
              currentTab.id = id++;
              newTabs.push(currentTab);
            }
            // add missing types
            for (const missingType of missingTypes) {
              switch (missingType) {
                case "descriptives":
                  newTabs.push({
                    title: "Descriptives " + studyName,
                    type: "descriptives",
                    studyId: study._id,
                    id: id++
                  });
                  break;
                case "overview":
                  newTabs.push({
                    title: "Overview " + studyName,
                    type: "overview",
                    studyId: study._id,
                    id: id++
                  });
                  break;
                case "userview":
                  newTabs.push({
                    title: "User view " + studyName,
                    type: "userview",
                    studyId: study._id,
                    id: id++
                  });
                  break;
              }
            }
            $tabStore = newTabs; tabStore.set($tabStore);
            updateTabStore(newTabs);
          }

          break;

        default:
          break;
      }
    }
  }

  function activateTab(tabIdx) {
    // console.log("activate ", tabIdx);
    $activeTabIdx = tabIdx; activeTabIdx.set($activeTabIdx);
  }

  function close(idx, tab) {
    console.log("close", idx, tab);
    if (idx > 0) {
      const reducedTabs = $tabStore.filter(v => v.id !== tab.id);
      let id = 0;
      for (const tab of reducedTabs) {
        tab.id = id++;
      }

      if ($activeTabIdx > reducedTabs.length - 1) {
        $activeTabIdx = reducedTabs.length - 1; activeTabIdx.set($activeTabIdx);
      }
      $tabStore = reducedTabs; tabStore.set($tabStore);
      updateTabStore(reducedTabs);
    }
  }

  function addCustomTab() {
    let id = 0;
    // get last id
    for (const tab of $tabStore) {
      id = tab.id;
    }
    const tab = {
      title: "Custom view ",
      type: "customview",
      studyId: null,
      id: ++id
    };
    console.log("custom tab", tab);
    $tabStore.push(tab);
    tabStore.set($tabStore);
    $activeTabIdx = id; activeTabIdx.set($activeTabIdx);
  }

	function click_handler({ idx, tab }) {
		return close(idx, tab);
	}

	function click_handler_1({ idx }) {
		return activateTab(idx);
	}

	function click_handler_2({ idx, tab }) {
		return close(idx, tab);
	}

	$$self.$$.update = ($$dirty = { $msgStore: 1 }) => {
		if ($$dirty.$msgStore) { handleMsgs($msgStore.filter(v => v.type === "navigation")); }
	};

	return {
		activateTab,
		close,
		addCustomTab,
		$tabStore,
		$activeTabIdx,
		click_handler,
		click_handler_1,
		click_handler_2
	};
}

class TabNavigation extends SvelteComponentDev {
	constructor(options) {
		super(options);
		init(this, options, instance$1, create_fragment$1, safe_not_equal, []);
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

/* src\charts\Anova.svelte generated by Svelte v3.6.7 */

const file$2 = "src\\charts\\Anova.svelte";

function create_fragment$2(ctx) {
	var div2, div0, t0, div1, table, tr0, td0, t2, td1, t3, t4, t5, t6, tr1, td2, t8, td3, t9_value = ctx.meanVal.toFixed(4), t9, t10, tr2, td4, t12, td5, t13_value = ctx.sd.toFixed(4), t13, t14, tr3, td6, t16, td7, t17, t18_value = ctx.ci[0].toFixed(4), t18, t19, t20_value = ctx.ci[1].toFixed(4), t20, t21;

	return {
		c: function create() {
			div2 = element("div");
			div0 = element("div");
			t0 = space();
			div1 = element("div");
			table = element("table");
			tr0 = element("tr");
			td0 = element("td");
			td0.textContent = "Min - Max:";
			t2 = space();
			td1 = element("td");
			t3 = text(ctx.minVal);
			t4 = text(" - ");
			t5 = text(ctx.maxVal);
			t6 = space();
			tr1 = element("tr");
			td2 = element("td");
			td2.textContent = "Mean:";
			t8 = space();
			td3 = element("td");
			t9 = text(t9_value);
			t10 = space();
			tr2 = element("tr");
			td4 = element("td");
			td4.textContent = "SD:";
			t12 = space();
			td5 = element("td");
			t13 = text(t13_value);
			t14 = space();
			tr3 = element("tr");
			td6 = element("td");
			td6.textContent = "CI:";
			t16 = space();
			td7 = element("td");
			t17 = text("[ ");
			t18 = text(t18_value);
			t19 = text(" ; ");
			t20 = text(t20_value);
			t21 = text(" ] (a=0.05)");
			attr(div0, "id", "anovaChart");
			attr(div0, "class", "svelte-92ikm6");
			add_location(div0, file$2, 296, 2, 7736);
			attr(td0, "class", "svelte-92ikm6");
			add_location(td0, file$2, 300, 8, 7821);
			attr(td1, "class", "svelte-92ikm6");
			add_location(td1, file$2, 301, 8, 7850);
			attr(tr0, "class", "svelte-92ikm6");
			add_location(tr0, file$2, 299, 6, 7807);
			attr(td2, "class", "svelte-92ikm6");
			add_location(td2, file$2, 304, 8, 7913);
			attr(td3, "class", "svelte-92ikm6");
			add_location(td3, file$2, 305, 8, 7937);
			attr(tr1, "class", "svelte-92ikm6");
			add_location(tr1, file$2, 303, 6, 7899);
			attr(td4, "class", "svelte-92ikm6");
			add_location(td4, file$2, 308, 8, 8001);
			attr(td5, "class", "svelte-92ikm6");
			add_location(td5, file$2, 309, 8, 8023);
			attr(tr2, "class", "svelte-92ikm6");
			add_location(tr2, file$2, 307, 6, 7987);
			attr(td6, "class", "svelte-92ikm6");
			add_location(td6, file$2, 312, 8, 8082);
			attr(td7, "class", "svelte-92ikm6");
			add_location(td7, file$2, 313, 8, 8104);
			attr(tr3, "class", "svelte-92ikm6");
			add_location(tr3, file$2, 311, 6, 8068);
			attr(table, "class", "svelte-92ikm6");
			add_location(table, file$2, 298, 4, 7792);
			attr(div1, "class", "statTable");
			add_location(div1, file$2, 297, 2, 7763);
			attr(div2, "class", "container svelte-92ikm6");
			add_location(div2, file$2, 295, 0, 7709);
		},

		l: function claim(nodes) {
			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
		},

		m: function mount(target, anchor) {
			insert(target, div2, anchor);
			append(div2, div0);
			append(div2, t0);
			append(div2, div1);
			append(div1, table);
			append(table, tr0);
			append(tr0, td0);
			append(tr0, t2);
			append(tr0, td1);
			append(td1, t3);
			append(td1, t4);
			append(td1, t5);
			append(table, t6);
			append(table, tr1);
			append(tr1, td2);
			append(tr1, t8);
			append(tr1, td3);
			append(td3, t9);
			append(table, t10);
			append(table, tr2);
			append(tr2, td4);
			append(tr2, t12);
			append(tr2, td5);
			append(td5, t13);
			append(table, t14);
			append(table, tr3);
			append(tr3, td6);
			append(tr3, t16);
			append(tr3, td7);
			append(td7, t17);
			append(td7, t18);
			append(td7, t19);
			append(td7, t20);
			append(td7, t21);
		},

		p: function update(changed, ctx) {
			if (changed.minVal) {
				set_data(t3, ctx.minVal);
			}

			if (changed.maxVal) {
				set_data(t5, ctx.maxVal);
			}

			if ((changed.meanVal) && t9_value !== (t9_value = ctx.meanVal.toFixed(4))) {
				set_data(t9, t9_value);
			}

			if ((changed.sd) && t13_value !== (t13_value = ctx.sd.toFixed(4))) {
				set_data(t13, t13_value);
			}

			if ((changed.ci) && t18_value !== (t18_value = ctx.ci[0].toFixed(4))) {
				set_data(t18, t18_value);
			}

			if ((changed.ci) && t20_value !== (t20_value = ctx.ci[1].toFixed(4))) {
				set_data(t20, t20_value);
			}
		},

		i: noop,
		o: noop,

		d: function destroy(detaching) {
			if (detaching) {
				detach(div2);
			}
		}
	};
}

const alpha = 0.05;

function instance$2($$self, $$props, $$invalidate) {
	
  let { studyId, dependentVariable } = $$props;
  let anovaChart;
  let old = "";
  let count = 0;
  let minVal = 0;
  let meanVal = 0;
  let sd = 0;
  let maxVal = 0;
  let ci = [0, 0];

  function updateChart(variable) {
    if (!anovaChart) return;
    anovaChart.showLoading();
    const [data, errorData] = getStatData(variable);
    anovaChart.hideLoading();
    anovaChart.setOption({
      series: [
        {
          name: "Availability",
          data: data
        },
        {
          name: "CI",
          data: errorData
        }
      ]
    });
  }
  function getStatData(dependentVariable) {
    if (!dependentVariable) return [[], []];
    const resultsByDay = [[], [], [], [], [], [], []]; // array index -> day of week starting at 0 (monday)
    const results = dependentVariable.results.map(v => v.value);
    $$invalidate('minVal', minVal = simpleStatistics_min.min(results));
    $$invalidate('maxVal', maxVal = simpleStatistics_min.max(results));
    $$invalidate('meanVal', meanVal = simpleStatistics_min.mean(results));
    count = results.length;
    $$invalidate('sd', sd = simpleStatistics_min.standardDeviation(results));
    $$invalidate('ci', ci = mctad.confidenceIntervalOnTheMean(meanVal, sd, count, alpha));
    for (const result of dependentVariable.results) {
      const resultDate = new Date(result.date);
      // 0: sunday - 6: saturday (US week format!)
      // convert to 0: monday - 6 sunday
      const resultDay = (+resultDate.getDay() + 6) % 7;
      resultsByDay[resultDay].push(result.value);
    }

    const statData = [];
    const errorData = [];

    for (let day = 0; day < 7; ++day) {
      const results = resultsByDay[day];
      if (results && results.length) {
        const mean = simpleStatistics_min.mean(results);
        const sd = simpleStatistics_min.standardDeviation(results);
        const n = results.length;
        statData.push(mean);
        if (n < 2) {
          errorData.push([day, 0, 0, n, 0]);
          continue;
        }
        errorData.push([
          day,
          ...mctad.confidenceIntervalOnTheMean(mean, sd, n, alpha),
          n,
          sd
        ]);
        // console.log(mean, mctad.confidenceIntervalOnTheMean(mean, sd, n, 0.05));
      } else {
        statData.push(0);
        errorData.push([day, 0, 0, 0, 0]);
      }
    }
    return [statData, errorData];
  }

  onMount(() => {
    anovaChart = echarts.init(document.getElementById("anovaChart"));
    const [statData, errorData] = getStatData(dependentVariable);

    const categoryData = [
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
      "Sunday"
    ];

    function renderItem(params, api) {
      var xValue = api.value(0);
      var highPoint = api.coord([xValue, api.value(1)]);
      var lowPoint = api.coord([xValue, api.value(2)]);
      var halfWidth = api.size([1, 0])[0] * 0.05;
      var style = api.style({
        stroke: "#314655",
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
        },
        formatter: function(data) {
          const mean = data[0].data;
          const [_, left, right, n, sd] = data[1].data;
          return `<table style="font-size:0.8rem;">
                  <tr>
                    <td>Mean</td>
                    <td style="padding-left:0.5rem;">${mean.toFixed(4)}</td>
                  </tr>
                  <tr>
                    <td>SD</td>
                    <td style="padding-left:0.5rem;">${sd.toFixed(4)}</td>
                  </tr>
                  <tr>
                    <td>CI</td>
                    <td style="padding-left:0.5rem;">[${left.toFixed(
                      4
                    )} ; ${right.toFixed(4)}]</td>
                  </tr>
                  <tr>
                    <td>alpha</td>
                    <td style="padding-left:0.5rem;"> 0.05 </td>
                  </tr>
                  <tr>
                    <td>Records</td>
                    <td style="padding-left:0.5rem;">${n}</td>
                  </tr>
                  </table>`;
        }
      },
      grid: {
        left: 36,
        top: 5,
        right: 0,
        bottom: 25
      },
      xAxis: {
        data: categoryData
      },
      yAxis: {
        axisLabel: {
          showMaxLabel: false
        },
        splitLine: {
          show: true,
          lineStyle: {
            color: "#ddd",
            type: "dashed"
          }
        }
      },
      series: [
        {
          type: "bar",
          name: "Availability",
          data: statData,
          itemStyle: {
            normal: {
              color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                { offset: 0, color: "#a4b8c9" },
                { offset: 0.85, color: "#a4b8c9" },
                { offset: 1, color: "#9caebe" }
              ])
            }
          },
          label: {
            normal: {
              show: true,
              color: "#333",
              formatter: function(value, idx) {
                return value.data.toFixed(2);
              }
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

	const writable_props = ['studyId', 'dependentVariable'];
	Object.keys($$props).forEach(key => {
		if (!writable_props.includes(key) && !key.startsWith('$$')) console.warn(`<Anova> was created with unknown prop '${key}'`);
	});

	$$self.$set = $$props => {
		if ('studyId' in $$props) $$invalidate('studyId', studyId = $$props.studyId);
		if ('dependentVariable' in $$props) $$invalidate('dependentVariable', dependentVariable = $$props.dependentVariable);
	};

	$$self.$$.update = ($$dirty = { dependentVariable: 1, old: 1 }) => {
		if ($$dirty.dependentVariable || $$dirty.old) { if (dependentVariable !== old) {
        $$invalidate('old', old = dependentVariable);
        if (dependentVariable) {
          updateChart(dependentVariable);
        }
      } }
	};

	return {
		studyId,
		dependentVariable,
		minVal,
		meanVal,
		sd,
		maxVal,
		ci
	};
}

class Anova extends SvelteComponentDev {
	constructor(options) {
		super(options);
		init(this, options, instance$2, create_fragment$2, safe_not_equal, ["studyId", "dependentVariable"]);

		const { ctx } = this.$$;
		const props = options.props || {};
		if (ctx.studyId === undefined && !('studyId' in props)) {
			console.warn("<Anova> was created without expected prop 'studyId'");
		}
		if (ctx.dependentVariable === undefined && !('dependentVariable' in props)) {
			console.warn("<Anova> was created without expected prop 'dependentVariable'");
		}
	}

	get studyId() {
		throw new Error("<Anova>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set studyId(value) {
		throw new Error("<Anova>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get dependentVariable() {
		throw new Error("<Anova>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set dependentVariable(value) {
		throw new Error("<Anova>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}
}

/* src\charts\WeekChart.svelte generated by Svelte v3.6.7 */

const file$3 = "src\\charts\\WeekChart.svelte";

function create_fragment$3(ctx) {
	var div;

	return {
		c: function create() {
			div = element("div");
			attr(div, "id", "weekChart");
			attr(div, "class", "svelte-uu58md");
			add_location(div, file$3, 289, 0, 5577);
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
		init(this, options, instance$3, create_fragment$3, safe_not_equal, []);
	}
}

/* src\charts\BDAChart.svelte generated by Svelte v3.6.7 */

const file$4 = "src\\charts\\BDAChart.svelte";

function create_fragment$4(ctx) {
	var div;

	return {
		c: function create() {
			div = element("div");
			attr(div, "id", "BDAChart");
			attr(div, "class", "svelte-1j0o2bd");
			add_location(div, file$4, 75, 0, 1577);
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
    let BDAChart = echarts.init(document.getElementById("BDAChart"));
    const option = {
      grid: {
        left: 36,
        top: 30,
        right: 10,
        bottom: 30
      },
      legend: { show: true },
      xAxis: {
        type: "category",
        data: ["Before", "During", "After"]
      },
      yAxis: {
        axisLabel: {
          showMaxLabel: true
        },
        name: "Availability"
      },
      series: [
        {
          name: "Work",
          data: [4.6, 5.8, 4.9],
          type: "line",
          symbol: "triangle",
          symbolSize: 10
        },
        {
          name: "Leisure",
          data: [3.6, 6.8, 4.9],
          type: "line",
          symbol: "circle",
          symbolSize: 10
        },
        {
          name: "Television",
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
		init(this, options, instance$4, create_fragment$4, safe_not_equal, []);
	}
}

/* src\charts\ContextPie.svelte generated by Svelte v3.6.7 */

const file$5 = "src\\charts\\ContextPie.svelte";

function create_fragment$5(ctx) {
	var div;

	return {
		c: function create() {
			div = element("div");
			attr(div, "id", "ContextPieChart");
			attr(div, "class", "svelte-8xdxio");
			add_location(div, file$5, 101, 0, 2454);
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
		init(this, options, instance$5, create_fragment$5, safe_not_equal, []);
	}
}

/* src\charts\ImageChart.svelte generated by Svelte v3.6.7 */

const file$6 = "src\\charts\\ImageChart.svelte";

function get_each_context$1(ctx, list, i) {
	const child_ctx = Object.create(ctx);
	child_ctx.val = list[i];
	return child_ctx;
}

// (47:2) {#each items as val}
function create_each_block$1(ctx) {
	var tr, td0, img, img_src_value, img_alt_value, t0, td1, t1_value = formatDate(new Date(), true, false), t1, t2, td2, t3_value = ctx.val, t3, t4;

	return {
		c: function create() {
			tr = element("tr");
			td0 = element("td");
			img = element("img");
			t0 = space();
			td1 = element("td");
			t1 = text(t1_value);
			t2 = space();
			td2 = element("td");
			t3 = text(t3_value);
			t4 = space();
			attr(img, "src", img_src_value = "https://unsplash.it/15" + ctx.val + "/15" + ctx.val);
			attr(img, "alt", img_alt_value = ctx.val);
			attr(img, "class", "svelte-wgkkrf");
			add_location(img, file$6, 49, 8, 887);
			set_style(td0, "width", "250px");
			attr(td0, "class", "svelte-wgkkrf");
			add_location(td0, file$6, 48, 6, 852);
			attr(td1, "class", "svelte-wgkkrf");
			add_location(td1, file$6, 51, 6, 967);
			attr(td2, "class", "svelte-wgkkrf");
			add_location(td2, file$6, 52, 6, 1021);
			attr(tr, "class", "svelte-wgkkrf");
			add_location(tr, file$6, 47, 4, 840);
		},

		m: function mount(target, anchor) {
			insert(target, tr, anchor);
			append(tr, td0);
			append(td0, img);
			append(tr, t0);
			append(tr, td1);
			append(td1, t1);
			append(tr, t2);
			append(tr, td2);
			append(td2, t3);
			append(tr, t4);
		},

		p: function update(changed, ctx) {
			if ((changed.items) && img_src_value !== (img_src_value = "https://unsplash.it/15" + ctx.val + "/15" + ctx.val)) {
				attr(img, "src", img_src_value);
			}

			if ((changed.items) && img_alt_value !== (img_alt_value = ctx.val)) {
				attr(img, "alt", img_alt_value);
			}

			if ((changed.items) && t3_value !== (t3_value = ctx.val)) {
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

function create_fragment$6(ctx) {
	var t0, table, thead, tr, th0, t2, th1, t4, th2, t6;

	var each_value = ctx.items;

	var each_blocks = [];

	for (var i = 0; i < each_value.length; i += 1) {
		each_blocks[i] = create_each_block$1(get_each_context$1(ctx, each_value, i));
	}

	return {
		c: function create() {
			t0 = text("Uploaded Images:\r\n");
			table = element("table");
			thead = element("thead");
			tr = element("tr");
			th0 = element("th");
			th0.textContent = "Image";
			t2 = space();
			th1 = element("th");
			th1.textContent = "Date";
			t4 = space();
			th2 = element("th");
			th2.textContent = "Availability";
			t6 = space();

			for (var i = 0; i < each_blocks.length; i += 1) {
				each_blocks[i].c();
			}
			attr(th0, "class", "svelte-wgkkrf");
			add_location(th0, file$6, 41, 6, 723);
			attr(th1, "class", "svelte-wgkkrf");
			add_location(th1, file$6, 42, 6, 745);
			attr(th2, "class", "svelte-wgkkrf");
			add_location(th2, file$6, 43, 6, 766);
			attr(tr, "class", "svelte-wgkkrf");
			add_location(tr, file$6, 40, 4, 711);
			attr(thead, "class", "svelte-wgkkrf");
			add_location(thead, file$6, 39, 2, 698);
			attr(table, "class", "svelte-wgkkrf");
			add_location(table, file$6, 38, 0, 687);
		},

		l: function claim(nodes) {
			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
		},

		m: function mount(target, anchor) {
			insert(target, t0, anchor);
			insert(target, table, anchor);
			append(table, thead);
			append(thead, tr);
			append(tr, th0);
			append(tr, t2);
			append(tr, th1);
			append(tr, t4);
			append(tr, th2);
			append(table, t6);

			for (var i = 0; i < each_blocks.length; i += 1) {
				each_blocks[i].m(table, null);
			}
		},

		p: function update(changed, ctx) {
			if (changed.items || changed.formatDate) {
				each_value = ctx.items;

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
				detach(t0);
				detach(table);
			}

			destroy_each(each_blocks, detaching);
		}
	};
}

function instance$6($$self, $$props, $$invalidate) {
	const items = [];
  for (let index = 0; index < 5; index++) {
    items.push(~~(Math.random() * 9));
  }
  $$invalidate('items', items);

	return { items };
}

class ImageChart extends SvelteComponentDev {
	constructor(options) {
		super(options);
		init(this, options, instance$6, create_fragment$6, safe_not_equal, []);
	}
}

/* src\views\Userview.svelte generated by Svelte v3.6.7 */

const file$7 = "src\\views\\Userview.svelte";

function create_fragment$7(ctx) {
	var div7, div0, select, option0, option1, option2, option3, option4, t5, div6, div1, t6, div2, t7, div3, t8, div4, t9, div5, div7_intro, current;

	var anova = new Anova({
		props: {
		studyId: ctx.studyId,
		dependentVariable: ctx.dependentVariable
	},
		$$inline: true
	});

	var weekchart = new WeekChart({ $$inline: true });

	var bdachart = new BDAChart({ $$inline: true });

	var contextpie = new ContextPie({ $$inline: true });

	var imagechart = new ImageChart({ $$inline: true });

	return {
		c: function create() {
			div7 = element("div");
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
			div6 = element("div");
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
			t9 = space();
			div5 = element("div");
			imagechart.$$.fragment.c();
			option0.__value = "1";
			option0.value = option0.__value;
			add_location(option0, file$7, 57, 6, 1513);
			option1.__value = "2";
			option1.value = option1.__value;
			add_location(option1, file$7, 60, 6, 1614);
			option2.__value = "3";
			option2.value = option2.__value;
			add_location(option2, file$7, 63, 6, 1715);
			option3.__value = "4";
			option3.value = option3.__value;
			add_location(option3, file$7, 64, 6, 1797);
			option4.__value = "5";
			option4.value = option4.__value;
			add_location(option4, file$7, 67, 6, 1898);
			attr(select, "name", "user");
			attr(select, "id", "userSelect");
			add_location(select, file$7, 56, 4, 1469);
			attr(div0, "class", "optionsContainer svelte-1voovkg");
			add_location(div0, file$7, 55, 2, 1433);
			attr(div1, "class", "widget svelte-1voovkg");
			add_location(div1, file$7, 85, 4, 2489);
			attr(div2, "class", "widget svelte-1voovkg");
			add_location(div2, file$7, 88, 4, 2574);
			attr(div3, "class", "widget svelte-1voovkg");
			add_location(div3, file$7, 91, 4, 2633);
			attr(div4, "class", "widget svelte-1voovkg");
			add_location(div4, file$7, 94, 4, 2691);
			attr(div5, "class", "widget svelte-1voovkg");
			add_location(div5, file$7, 97, 4, 2751);
			attr(div6, "class", "widgetContainer svelte-1voovkg");
			add_location(div6, file$7, 84, 2, 2454);
			attr(div7, "class", "userview svelte-1voovkg");
			add_location(div7, file$7, 54, 0, 1379);
		},

		l: function claim(nodes) {
			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
		},

		m: function mount(target, anchor) {
			insert(target, div7, anchor);
			append(div7, div0);
			append(div0, select);
			append(select, option0);
			append(select, option1);
			append(select, option2);
			append(select, option3);
			append(select, option4);
			append(div7, t5);
			append(div7, div6);
			append(div6, div1);
			mount_component(anova, div1, null);
			append(div6, t6);
			append(div6, div2);
			mount_component(weekchart, div2, null);
			append(div6, t7);
			append(div6, div3);
			mount_component(bdachart, div3, null);
			append(div6, t8);
			append(div6, div4);
			mount_component(contextpie, div4, null);
			append(div6, t9);
			append(div6, div5);
			mount_component(imagechart, div5, null);
			current = true;
		},

		p: function update(changed, ctx) {
			var anova_changes = {};
			if (changed.studyId) anova_changes.studyId = ctx.studyId;
			if (changed.dependentVariable) anova_changes.dependentVariable = ctx.dependentVariable;
			anova.$set(anova_changes);
		},

		i: function intro(local) {
			if (current) return;
			transition_in(anova.$$.fragment, local);

			transition_in(weekchart.$$.fragment, local);

			transition_in(bdachart.$$.fragment, local);

			transition_in(contextpie.$$.fragment, local);

			transition_in(imagechart.$$.fragment, local);

			if (!div7_intro) {
				add_render_callback(() => {
					div7_intro = create_in_transition(div7, fade, { duration: 300 });
					div7_intro.start();
				});
			}

			current = true;
		},

		o: function outro(local) {
			transition_out(anova.$$.fragment, local);
			transition_out(weekchart.$$.fragment, local);
			transition_out(bdachart.$$.fragment, local);
			transition_out(contextpie.$$.fragment, local);
			transition_out(imagechart.$$.fragment, local);
			current = false;
		},

		d: function destroy(detaching) {
			if (detaching) {
				detach(div7);
			}

			destroy_component(anova, );

			destroy_component(weekchart, );

			destroy_component(bdachart, );

			destroy_component(contextpie, );

			destroy_component(imagechart, );
		}
	};
}

function instance$7($$self, $$props, $$invalidate) {
	let $variableStore;

	validate_store(variableStore, 'variableStore');
	subscribe($$self, variableStore, $$value => { $variableStore = $$value; $$invalidate('$variableStore', $variableStore); });

	
  let { studyId } = $$props;

  let dependentVariable;
  const numericVariables = $variableStore.filter(
    v =>
      v.studyId === studyId &&
      v.isDemographic === false &&
      v.measure === "scale"
  );
  if (numericVariables && numericVariables.length) {
    $$invalidate('dependentVariable', dependentVariable = numericVariables[0]);
  }

	const writable_props = ['studyId'];
	Object.keys($$props).forEach(key => {
		if (!writable_props.includes(key) && !key.startsWith('$$')) console.warn(`<Userview> was created with unknown prop '${key}'`);
	});

	$$self.$set = $$props => {
		if ('studyId' in $$props) $$invalidate('studyId', studyId = $$props.studyId);
	};

	return { studyId, dependentVariable };
}

class Userview extends SvelteComponentDev {
	constructor(options) {
		super(options);
		init(this, options, instance$7, create_fragment$7, safe_not_equal, ["studyId"]);

		const { ctx } = this.$$;
		const props = options.props || {};
		if (ctx.studyId === undefined && !('studyId' in props)) {
			console.warn("<Userview> was created without expected prop 'studyId'");
		}
	}

	get studyId() {
		throw new Error("<Userview>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set studyId(value) {
		throw new Error("<Userview>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}
}

/* src\charts\MainChartSummary.svelte generated by Svelte v3.6.7 */

const file$8 = "src\\charts\\MainChartSummary.svelte";

function create_fragment$8(ctx) {
	var div;

	return {
		c: function create() {
			div = element("div");
			attr(div, "id", "mainChartSummary");
			set_style(div, "width", "100%");
			set_style(div, "height", "100%");
			add_location(div, file$8, 155, 0, 4312);
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

function getStatData(dependentVariable) {
  if (!dependentVariable) return [];
  const resultsByHour = new Map();
  for (const result of dependentVariable.results) {
    const resultDate = new Date(result.date);
    const hour = resultDate.getHours();
    const rs = resultsByHour.get(hour) || [];
    rs.push(result.value);
    resultsByHour.set(hour, rs);
  }

  const data = [];
  for (let i = 0; i < 24; i++) {
    const results = resultsByHour.get(i) || [0];
    data.push([
      simpleStatistics_min.mean(results),
      i,
      simpleStatistics_min.standardDeviation(results),
      results.length
    ]);
  }
  return data;
}

function instance$8($$self, $$props, $$invalidate) {
	
  let { studyId, dependentVariable } = $$props;
  let mainChartSummary;
  let old = "";

  function updateChart(variable) {
    if (!mainChartSummary) return;
    mainChartSummary.showLoading();
    const data = getStatData(variable);
    mainChartSummary.hideLoading();
    mainChartSummary.setOption({
      series: [
        {
          data: data
        }
      ]
    });
  }

  onMount(() => {
    mainChartSummary = echarts.init(
      document.getElementById("mainChartSummary")
    );
    const data = getStatData(dependentVariable);
    const option = {
      tooltip: {
        trigger: "axis",
        formatter: function(data) {
          const d = data[0].data;
          return `<table style="font-size:0.8rem;">
                  <tr>
                    <td>Mean</td>
                    <td style="padding-left:0.5rem;">${d[0].toFixed(4)}</td>
                  </tr>
                  <tr>
                    <td>SD</td>
                    <td style="padding-left:0.5rem;">${d[2].toFixed(4)}</td>
                  </tr>
                  <tr>
                    <td>Responses</td>
                    <td style="padding-left:0.5rem;">${d[3]}</td>
                  </tr>
                  <tr>
                    <td>Timeslot</td>
                    <td style="padding-left:0.5rem;">[${d[1]}:00 - ${+d[1] +
            1}:00)</td>
                  </tr>
                  </table>`;
        }
      },
      grid: {
        top: 40,
        left: 2,
        bottom: 10,
        right: 50,
        containLabel: true
      },
      dataZoom: {
        type: "inside",
        yAxisIndex: [0],
        filterMode: "filter"
      },
      xAxis: {
        type: "value",
        name: "Avg."
      },
      yAxis: {
        type: "category",
        axisLine: { onZero: true },
        boundaryGap: false,
        name: "Time of day",
        max: 24,
        axisLabel: {
          formatter: function(value, idx) {
            let hour = ~~value;
            let minutes = ~~((value - hour) * 60);
            hour = hour < 10 ? "0" + hour : hour;
            minutes = minutes < 10 ? "0" + minutes : minutes;
            if (idx == 24) {
              return "24:00";
            }
            return `${hour}:${minutes}`;
          }
        },
        splitNumber: 8
      },
      series: [
        {
          // name: "Average availability",
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
          data
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

	const writable_props = ['studyId', 'dependentVariable'];
	Object.keys($$props).forEach(key => {
		if (!writable_props.includes(key) && !key.startsWith('$$')) console.warn(`<MainChartSummary> was created with unknown prop '${key}'`);
	});

	$$self.$set = $$props => {
		if ('studyId' in $$props) $$invalidate('studyId', studyId = $$props.studyId);
		if ('dependentVariable' in $$props) $$invalidate('dependentVariable', dependentVariable = $$props.dependentVariable);
	};

	$$self.$$.update = ($$dirty = { dependentVariable: 1, old: 1 }) => {
		if ($$dirty.dependentVariable || $$dirty.old) { if (dependentVariable !== old) {
        $$invalidate('old', old = dependentVariable);
        if (dependentVariable) {
          updateChart(dependentVariable);
        }
      } }
	};

	return { studyId, dependentVariable };
}

class MainChartSummary extends SvelteComponentDev {
	constructor(options) {
		super(options);
		init(this, options, instance$8, create_fragment$8, safe_not_equal, ["studyId", "dependentVariable"]);

		const { ctx } = this.$$;
		const props = options.props || {};
		if (ctx.studyId === undefined && !('studyId' in props)) {
			console.warn("<MainChartSummary> was created without expected prop 'studyId'");
		}
		if (ctx.dependentVariable === undefined && !('dependentVariable' in props)) {
			console.warn("<MainChartSummary> was created without expected prop 'dependentVariable'");
		}
	}

	get studyId() {
		throw new Error("<MainChartSummary>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set studyId(value) {
		throw new Error("<MainChartSummary>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get dependentVariable() {
		throw new Error("<MainChartSummary>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set dependentVariable(value) {
		throw new Error("<MainChartSummary>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}
}

/* src\charts\MainChart.svelte generated by Svelte v3.6.7 */

const file$9 = "src\\charts\\MainChart.svelte";

function get_each_context$2(ctx, list, i) {
	const child_ctx = Object.create(ctx);
	child_ctx.dv = list[i];
	return child_ctx;
}

// (288:6) {#each dvs as dv}
function create_each_block$2(ctx) {
	var option, t_value = ctx.dv.variableLabel, t, option_value_value;

	return {
		c: function create() {
			option = element("option");
			t = text(t_value);
			option.__value = option_value_value = ctx.dv;
			option.value = option.__value;
			add_location(option, file$9, 288, 8, 7362);
		},

		m: function mount(target, anchor) {
			insert(target, option, anchor);
			append(option, t);
		},

		p: function update(changed, ctx) {
			if ((changed.dvs) && t_value !== (t_value = ctx.dv.variableLabel)) {
				set_data(t, t_value);
			}

			if ((changed.dvs) && option_value_value !== (option_value_value = ctx.dv)) {
				option.__value = option_value_value;
			}

			option.value = option.__value;
		},

		d: function destroy(detaching) {
			if (detaching) {
				detach(option);
			}
		}
	};
}

function create_fragment$9(ctx) {
	var div4, div0, t0, select, t1, div3, div1, t2, t3, div2, current, dispose;

	var each_value = ctx.dvs;

	var each_blocks = [];

	for (var i = 0; i < each_value.length; i += 1) {
		each_blocks[i] = create_each_block$2(get_each_context$2(ctx, each_value, i));
	}

	var mainchartsummary = new MainChartSummary({
		props: {
		studyId: ctx.studyId,
		dependentVariable: ctx.dependentVariable
	},
		$$inline: true
	});

	var anova = new Anova({
		props: {
		studyId: ctx.studyId,
		dependentVariable: ctx.dependentVariable
	},
		$$inline: true
	});

	return {
		c: function create() {
			div4 = element("div");
			div0 = element("div");
			t0 = text("Variable:\r\n    ");
			select = element("select");

			for (var i = 0; i < each_blocks.length; i += 1) {
				each_blocks[i].c();
			}

			t1 = space();
			div3 = element("div");
			div1 = element("div");
			t2 = space();
			mainchartsummary.$$.fragment.c();
			t3 = space();
			div2 = element("div");
			anova.$$.fragment.c();
			if (ctx.dependentVariable === void 0) add_render_callback(() => ctx.select_change_handler.call(select));
			attr(select, "name", "dv");
			attr(select, "id", "dv");
			attr(select, "class", "svelte-f2p904");
			add_location(select, file$9, 282, 4, 7216);
			attr(div0, "class", "filter svelte-f2p904");
			add_location(div0, file$9, 280, 2, 7175);
			attr(div1, "id", "mainChart");
			set_style(div1, "width", "100%");
			set_style(div1, "height", "100%");
			add_location(div1, file$9, 297, 4, 7628);
			attr(div2, "class", "anova svelte-f2p904");
			add_location(div2, file$9, 299, 4, 7744);
			attr(div3, "class", "charts svelte-f2p904");
			add_location(div3, file$9, 296, 2, 7602);
			attr(div4, "class", "container svelte-f2p904");
			add_location(div4, file$9, 279, 0, 7148);

			dispose = [
				listen(select, "change", ctx.select_change_handler),
				listen(select, "change", ctx.selectHandler)
			];
		},

		l: function claim(nodes) {
			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
		},

		m: function mount(target, anchor) {
			insert(target, div4, anchor);
			append(div4, div0);
			append(div0, t0);
			append(div0, select);

			for (var i = 0; i < each_blocks.length; i += 1) {
				each_blocks[i].m(select, null);
			}

			select_option(select, ctx.dependentVariable);

			append(div4, t1);
			append(div4, div3);
			append(div3, div1);
			append(div3, t2);
			mount_component(mainchartsummary, div3, null);
			append(div3, t3);
			append(div3, div2);
			mount_component(anova, div2, null);
			current = true;
		},

		p: function update(changed, ctx) {
			if (changed.dvs) {
				each_value = ctx.dvs;

				for (var i = 0; i < each_value.length; i += 1) {
					const child_ctx = get_each_context$2(ctx, each_value, i);

					if (each_blocks[i]) {
						each_blocks[i].p(changed, child_ctx);
					} else {
						each_blocks[i] = create_each_block$2(child_ctx);
						each_blocks[i].c();
						each_blocks[i].m(select, null);
					}
				}

				for (; i < each_blocks.length; i += 1) {
					each_blocks[i].d(1);
				}
				each_blocks.length = each_value.length;
			}

			if (changed.dependentVariable) select_option(select, ctx.dependentVariable);

			var mainchartsummary_changes = {};
			if (changed.studyId) mainchartsummary_changes.studyId = ctx.studyId;
			if (changed.dependentVariable) mainchartsummary_changes.dependentVariable = ctx.dependentVariable;
			mainchartsummary.$set(mainchartsummary_changes);

			var anova_changes = {};
			if (changed.studyId) anova_changes.studyId = ctx.studyId;
			if (changed.dependentVariable) anova_changes.dependentVariable = ctx.dependentVariable;
			anova.$set(anova_changes);
		},

		i: function intro(local) {
			if (current) return;
			transition_in(mainchartsummary.$$.fragment, local);

			transition_in(anova.$$.fragment, local);

			current = true;
		},

		o: function outro(local) {
			transition_out(mainchartsummary.$$.fragment, local);
			transition_out(anova.$$.fragment, local);
			current = false;
		},

		d: function destroy(detaching) {
			if (detaching) {
				detach(div4);
			}

			destroy_each(each_blocks, detaching);

			destroy_component(mainchartsummary, );

			destroy_component(anova, );

			run_all(dispose);
		}
	};
}

function instance$9($$self, $$props, $$invalidate) {
	let $variableStore;

	validate_store(variableStore, 'variableStore');
	subscribe($$self, variableStore, $$value => { $variableStore = $$value; $$invalidate('$variableStore', $variableStore); });

	

  let { studyId } = $$props;

  let mainChart;
  let dvs = [];
  let minVal,
    maxVal = 0;
  let dependentVariable;

  function selectHandler() {
    updateChart(dependentVariable);
  }

  function updateChart(variable) {
    if (!mainChart) return;
    mainChart.showLoading();
    const data = getStatData(variable);
    mainChart.hideLoading();
    mainChart.setOption({
      visualMap: {
        min: minVal,
        max: maxVal
      },
      legend: {
        show: true,
        data: [dependentVariable.variableName],
        left: "center"
      },
      series: [
        {
          name: dependentVariable.variableName,
          data: data
        }
      ]
    });
  }

  function getStatData(dependentVariable) {
    const resultsByDayAndHour = [
      new Map(),
      new Map(),
      new Map(),
      new Map(),
      new Map(),
      new Map(),
      new Map()
    ];
    minVal = simpleStatistics_min.min(dependentVariable.results.map(v => v.value));
    maxVal = simpleStatistics_min.max(dependentVariable.results.map(v => v.value));
    dependentVariable.variableName = dependentVariable.variableLabel;
    for (const result of dependentVariable.results) {
      const resultDate = new Date(result.date);
      // 0: sunday - 6: saturday (US week format!)
      // convert to 0: monday - 6 sunday
      const resultDay = (+resultDate.getDay() + 6) % 7;
      const hour = resultDate.getHours();
      const rs = resultsByDayAndHour[resultDay].get(hour) || [];
      rs.push(result.value);
      resultsByDayAndHour[resultDay].set(hour, rs);
    }

    const statData = [];
    for (const day in resultsByDayAndHour) {
      for (const [hour, results] of resultsByDayAndHour[day]) {
        statData.push([
          +day + 1, // start at 1 for monday, cast to int and do not concatenate strings (WTF Javascript?!)
          hour,
          simpleStatistics_min.mean(results),
          simpleStatistics_min.standardDeviation(results),
          results.length
        ]);
      }
    }
    return statData;
  }

  onMount(() => {
    mainChart = echarts.init(document.getElementById("mainChart"));
    const numericVariables = $variableStore.filter(
      v =>
        v.studyId === studyId &&
        v.isDemographic === false &&
        v.measure === "scale"
    );
    $$invalidate('dvs', dvs = numericVariables);
    let statData = [];
    if (numericVariables && numericVariables.length) {
      $$invalidate('dependentVariable', dependentVariable = numericVariables[0]);
      statData = getStatData(dependentVariable);
    }

    const days = [
      "",
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
      "Sunday"
    ];

    const option = {
      dataZoom: {
        type: "inside",
        yAxisIndex: [0],
        filterMode: "filter"
      },
      visualMap: {
        right: 10,
        top: "25%",
        dimension: 2,
        min: minVal,
        max: maxVal,
        itemWidth: 15,
        itemHeight: 100,
        calculable: true,
        precision: 0.1,
        text: ["Mean"],
        textGap: 10,
        textStyle: {
          color: "#333"
        },
        outOfRange: {
          color: ["rgba(0,0,0,0.1)"]
        }
      },
      legend: {
        show: true,
        data: [dependentVariable.variableName],
        left: "center"
      },
      tooltip: {
        position: "top",
        formatter: function(d) {
          return `<table style="font-size:0.8rem;">
                  <tr>
                    <td colspan=2>${days[d.value[0]]}</td>
                  </tr>
                  <tr>
                    <td>Timeslot</td>
                    <td style="padding-left:0.5rem;">[${d.value[1]}:00 - ${+d
            .value[1] + 1}:00)</td>
                  </tr>
                  <tr>
                    <td>Mean</td>
                    <td style="padding-left:0.5rem;">${d.value[2].toFixed(
                      4
                    )}</td>
                  </tr>
                  <tr>
                    <td>SD</td>
                    <td style="padding-left:0.5rem;">${d.value[3].toFixed(
                      4
                    )}</td>
                  </tr>
                  <tr>
                    <td>Responses</td>
                    <td style="padding-left:0.5rem;">${d.value[4]}</td>
                  </tr>
                  </table>`;
        }
      },
      grid: {
        top: 40,
        left: 2,
        bottom: 10,
        right: 110,
        containLabel: true
      },
      xAxis: {
        type: "category",
        boundaryGap: false,
        data: days,
        splitLine: {
          show: false,
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
        splitLine: {
          show: true,
          lineStyle: {
            color: "#ddd",
            type: "dashed"
          }
        },
        type: "value",
        boundaryGap: false,
        max: 24,
        name: "Time of day",
        axisLabel: {
          formatter: function(value, idx) {
            let hour = ~~value;
            let minutes = ~~((value - hour) * 60);
            hour = hour < 10 ? "0" + hour : hour;
            minutes = minutes < 10 ? "0" + minutes : minutes;

            return `${hour}:${minutes}`;
          }
        },
        splitNumber: 8
      },
      series: [
        {
          name: dependentVariable.variableName,
          type: "scatter",
          symbolSize: function(val) {
            return ((val[2] - minVal) / (maxVal - minVal)) * 24 + 5;
          },
          data: statData,
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

	const writable_props = ['studyId'];
	Object.keys($$props).forEach(key => {
		if (!writable_props.includes(key) && !key.startsWith('$$')) console.warn(`<MainChart> was created with unknown prop '${key}'`);
	});

	function select_change_handler() {
		dependentVariable = select_value(this);
		$$invalidate('dependentVariable', dependentVariable);
		$$invalidate('dvs', dvs);
	}

	$$self.$set = $$props => {
		if ('studyId' in $$props) $$invalidate('studyId', studyId = $$props.studyId);
	};

	return {
		studyId,
		dvs,
		dependentVariable,
		selectHandler,
		select_change_handler
	};
}

class MainChart extends SvelteComponentDev {
	constructor(options) {
		super(options);
		init(this, options, instance$9, create_fragment$9, safe_not_equal, ["studyId"]);

		const { ctx } = this.$$;
		const props = options.props || {};
		if (ctx.studyId === undefined && !('studyId' in props)) {
			console.warn("<MainChart> was created without expected prop 'studyId'");
		}
	}

	get studyId() {
		throw new Error("<MainChart>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set studyId(value) {
		throw new Error("<MainChart>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}
}

/* src\charts\Sherlock.svelte generated by Svelte v3.6.7 */

const file$a = "src\\charts\\Sherlock.svelte";

function create_fragment$a(ctx) {
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
			add_location(path, file$a, 269, 10, 5900);
			attr(svg0, "fill", "#333");
			attr(svg0, "xmlns", "http://www.w3.org/2000/svg");
			attr(svg0, "xmlns:xlink", "http://www.w3.org/1999/xlink");
			attr(svg0, "version", "1.1");
			attr(svg0, "x", "0px");
			attr(svg0, "y", "0px");
			attr(svg0, "viewBox", "-909 491 100 100");
			set_style(svg0, "enable-background", "new -909 491 100 100");
			attr(svg0, "xml:space", "preserve");
			add_location(svg0, file$a, 259, 8, 5568);
			attr(g0, "transform", "translate(600 600) scale(-0.69 0.69) translate(-600 -600)");
			add_location(g0, file$a, 258, 6, 5485);
			add_location(g1, file$a, 257, 4, 5474);
			attr(svg1, "xmlns", "http://www.w3.org/2000/svg");
			attr(svg1, "xmlns:xlink", "http://www.w3.org/1999/xlink");
			attr(svg1, "width", "2.5em");
			attr(svg1, "height", "2.5em");
			attr(svg1, "viewBox", "0 0 1200 1200");
			add_location(svg1, file$a, 251, 2, 5307);
			add_location(span, file$a, 301, 2, 8974);
			attr(div0, "id", "sherlockHeader");
			attr(div0, "class", "svelte-nary1h");
			add_location(div0, file$a, 250, 0, 5278);
			attr(div1, "id", "sherlockChart");
			attr(div1, "class", "svelte-nary1h");
			add_location(div1, file$a, 303, 0, 9005);
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

function instance$a($$self) {
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
          nameGap: 0,
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
          nameGap: 0,
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
          nameGap: 0,
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
          nameGap: 0,
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
		init(this, options, instance$a, create_fragment$a, safe_not_equal, []);
	}
}

/* src\views\Overview.svelte generated by Svelte v3.6.7 */

const file$b = "src\\views\\Overview.svelte";

function create_fragment$b(ctx) {
	var div1, div0, t, aside, div1_intro, current;

	var mainchart = new MainChart({
		props: { studyId: ctx.studyId },
		$$inline: true
	});

	var sherlock = new Sherlock({ $$inline: true });

	return {
		c: function create() {
			div1 = element("div");
			div0 = element("div");
			mainchart.$$.fragment.c();
			t = space();
			aside = element("aside");
			sherlock.$$.fragment.c();
			attr(div0, "class", "mainChart svelte-1lnmeup");
			add_location(div0, file$b, 29, 2, 578);
			attr(aside, "class", "svelte-1lnmeup");
			add_location(aside, file$b, 32, 2, 644);
			attr(div1, "class", "overview svelte-1lnmeup");
			add_location(div1, file$b, 28, 0, 524);
		},

		l: function claim(nodes) {
			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
		},

		m: function mount(target, anchor) {
			insert(target, div1, anchor);
			append(div1, div0);
			mount_component(mainchart, div0, null);
			append(div1, t);
			append(div1, aside);
			mount_component(sherlock, aside, null);
			current = true;
		},

		p: function update(changed, ctx) {
			var mainchart_changes = {};
			if (changed.studyId) mainchart_changes.studyId = ctx.studyId;
			mainchart.$set(mainchart_changes);
		},

		i: function intro(local) {
			if (current) return;
			transition_in(mainchart.$$.fragment, local);

			transition_in(sherlock.$$.fragment, local);

			if (!div1_intro) {
				add_render_callback(() => {
					div1_intro = create_in_transition(div1, fade, { duration: 300 });
					div1_intro.start();
				});
			}

			current = true;
		},

		o: function outro(local) {
			transition_out(mainchart.$$.fragment, local);
			transition_out(sherlock.$$.fragment, local);
			current = false;
		},

		d: function destroy(detaching) {
			if (detaching) {
				detach(div1);
			}

			destroy_component(mainchart, );

			destroy_component(sherlock, );
		}
	};
}

function instance$b($$self, $$props, $$invalidate) {
	

  let { studyId } = $$props;

	const writable_props = ['studyId'];
	Object.keys($$props).forEach(key => {
		if (!writable_props.includes(key) && !key.startsWith('$$')) console.warn(`<Overview> was created with unknown prop '${key}'`);
	});

	$$self.$set = $$props => {
		if ('studyId' in $$props) $$invalidate('studyId', studyId = $$props.studyId);
	};

	return { studyId };
}

class Overview extends SvelteComponentDev {
	constructor(options) {
		super(options);
		init(this, options, instance$b, create_fragment$b, safe_not_equal, ["studyId"]);

		const { ctx } = this.$$;
		const props = options.props || {};
		if (ctx.studyId === undefined && !('studyId' in props)) {
			console.warn("<Overview> was created without expected prop 'studyId'");
		}
	}

	get studyId() {
		throw new Error("<Overview>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set studyId(value) {
		throw new Error("<Overview>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}
}

/* src\components\StudyImporter.svelte generated by Svelte v3.6.7 */

const file$c = "src\\components\\StudyImporter.svelte";

function create_fragment$c(ctx) {
	var input, t0, label, figure, svg, path, t1, span;

	return {
		c: function create() {
			input = element("input");
			t0 = space();
			label = element("label");
			figure = element("figure");
			svg = svg_element("svg");
			path = svg_element("path");
			t1 = space();
			span = element("span");
			span.textContent = "Import study data";
			attr(input, "id", "studyImport");
			attr(input, "type", "file");
			input.multiple = true;
			attr(input, "accept", "application/json");
			attr(input, "class", "svelte-13au6jt");
			add_location(input, file$c, 315, 0, 12188);
			attr(path, "fill", "white");
			attr(path, "d", "M10 0l-5.2 4.9h3.3v5.1h3.8v-5.1h3.3l-5.2-4.9zm9.3\r\n        11.5l-3.2-2.1h-2l3.4 2.6h-3.5c-.1 0-.2.1-.2.1l-.8\r\n        2.3h-6l-.8-2.2c-.1-.1-.1-.2-.2-.2h-3.6l3.4-2.6h-2l-3.2 2.1c-.4.3-.7 1-.6\r\n        1.5l.6 3.1c.1.5.7.9 1.2.9h16.3c.6 0 1.1-.4\r\n        1.3-.9l.6-3.1c.1-.5-.2-1.2-.7-1.5z");
			add_location(path, file$c, 323, 6, 12429);
			attr(svg, "xmlns", "http://www.w3.org/2000/svg");
			attr(svg, "width", "2em");
			attr(svg, "height", "1.8em");
			attr(svg, "viewBox", "0 0 20 17");
			add_location(svg, file$c, 318, 4, 12306);
			attr(figure, "class", "svelte-13au6jt");
			add_location(figure, file$c, 317, 2, 12292);
			add_location(span, file$c, 332, 2, 12788);
			attr(label, "for", "studyImport");
			attr(label, "class", "svelte-13au6jt");
			add_location(label, file$c, 316, 0, 12263);
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
			append(label, span);
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

function instance$c($$self, $$props, $$invalidate) {
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
                      stepItem.isDemographic = JSON.parse(task.personalData);
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
                            uid: taskResult.userId,
                            taskResults: taskResult
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
              db
                .transaction("StudyResponses")
                .objectStore("StudyResponses")
                .getAll().onsuccess = e => {
                responseStore.set(e.target.result);
              };
              db
                .transaction("Users")
                .objectStore("Users")
                .getAll().onsuccess = e => {
                userStore.set(e.target.result);
              };
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
		init(this, options, instance$c, create_fragment$c, safe_not_equal, []);
	}
}

/* src\components\StudyCard.svelte generated by Svelte v3.6.7 */
const { console: console_1 } = globals;

const file$d = "src\\components\\StudyCard.svelte";

// (1:0) <script>    import { formatDate, downloadAsJson }
function create_catch_block(ctx) {
	return {
		c: noop,
		m: noop,
		p: noop,
		d: noop
	};
}

// (258:85)           Variables: {variableCount}
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
			if ((changed.$variableStore || changed._id) && t1_value !== (t1_value = ctx.variableCount)) {
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

// (1:0) <script>    import { formatDate, downloadAsJson }
function create_pending_block(ctx) {
	return {
		c: noop,
		m: noop,
		p: noop,
		d: noop
	};
}

function create_fragment$d(ctx) {
	var div7, div0, svg, path, t0, h4, t1, t2, div1, span0, t3, t4, t5, span1, t6, t7, t8, br, t9, span2, promise, t10, div2, span3, t12, t13_value = formatDate(ctx.earliestBeginOfDataGathering, false), t13, t14, t15_value = formatDate(ctx.endDate, false), t15, t16, div3, t17, t18_value = formatDate(ctx.__created), t18, t19, div6, div4, t21, div5, t22_value = ctx.selected ? 'unselect' : 'select', t22, dispose;

	let info = {
		ctx,
		current: null,
		token: null,
		pending: create_pending_block,
		then: create_then_block,
		catch: create_catch_block,
		value: 'variableCount',
		error: 'null'
	};

	handle_promise(promise = ctx.$variableStore.filter(ctx.func).length, info);

	return {
		c: function create() {
			div7 = element("div");
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
			span3.textContent = "Duration:";
			t12 = space();
			t13 = text(t13_value);
			t14 = text(" - ");
			t15 = text(t15_value);
			t16 = space();
			div3 = element("div");
			t17 = text("imported: ");
			t18 = text(t18_value);
			t19 = space();
			div6 = element("div");
			div4 = element("div");
			div4.textContent = "export";
			t21 = space();
			div5 = element("div");
			t22 = text(t22_value);
			attr(path, "fill", "#777");
			attr(path, "d", "M12,20C7.59,20 4,16.41 4,12C4,7.59 7.59,4 12,4C16.41,4 20,7.59\r\n        20,12C20,16.41 16.41,20 12,20M12,2C6.47,2 2,6.47 2,12C2,17.53 6.47,22\r\n        12,22C17.53,22 22,17.53 22,12C22,6.47 17.53,2\r\n        12,2M14.59,8L12,10.59L9.41,8L8,9.41L10.59,12L8,14.59L9.41,16L12,13.41L14.59,16L16,14.59L13.41,12L16,9.41L14.59,8Z");
			add_location(path, file$d, 243, 6, 5768);
			set_style(svg, "width", "24px");
			set_style(svg, "height", "24px");
			attr(svg, "viewBox", "0 0 24 24");
			add_location(svg, file$d, 242, 4, 5703);
			attr(div0, "class", "delete svelte-14yuj6o");
			add_location(div0, file$d, 241, 2, 5654);
			attr(h4, "class", "svelte-14yuj6o");
			add_location(h4, file$d, 251, 2, 6156);
			attr(span0, "class", "vars svelte-14yuj6o");
			add_location(span0, file$d, 253, 4, 6245);
			attr(span1, "class", "vars svelte-14yuj6o");
			add_location(span1, file$d, 254, 4, 6316);
			add_location(br, file$d, 255, 4, 6395);
			attr(span2, "class", "vars svelte-14yuj6o");
			add_location(span2, file$d, 256, 4, 6407);
			attr(div1, "class", "mainInfo svelte-14yuj6o");
			add_location(div1, file$d, 252, 2, 6217);
			attr(span3, "class", "svelte-14yuj6o");
			add_location(span3, file$d, 263, 4, 6641);
			attr(div2, "class", "date svelte-14yuj6o");
			add_location(div2, file$d, 262, 2, 6617);
			attr(div3, "class", "created svelte-14yuj6o");
			add_location(div3, file$d, 266, 2, 6763);
			attr(div4, "class", "export svelte-14yuj6o");
			add_location(div4, file$d, 268, 4, 6854);
			attr(div5, "class", "select svelte-14yuj6o");
			add_location(div5, file$d, 269, 4, 6915);
			attr(div6, "class", "actions svelte-14yuj6o");
			add_location(div6, file$d, 267, 2, 6827);
			attr(div7, "class", "card svelte-14yuj6o");
			toggle_class(div7, "selected", ctx.selected);
			add_location(div7, file$d, 240, 0, 5617);

			dispose = [
				listen(div0, "click", ctx.deleteStudy),
				listen(h4, "click", stop_propagation(ctx.showStudy)),
				listen(span0, "click", ctx.showUsers),
				listen(span1, "click", ctx.showResponses),
				listen(span2, "click", ctx.showVariables),
				listen(div4, "click", ctx.exportStudy),
				listen(div5, "click", ctx.selectStudy)
			];
		},

		l: function claim(nodes) {
			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
		},

		m: function mount(target, anchor) {
			insert(target, div7, anchor);
			append(div7, div0);
			append(div0, svg);
			append(svg, path);
			append(div7, t0);
			append(div7, h4);
			append(h4, t1);
			append(div7, t2);
			append(div7, div1);
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

			append(div7, t10);
			append(div7, div2);
			append(div2, span3);
			append(div2, t12);
			append(div2, t13);
			append(div2, t14);
			append(div2, t15);
			append(div7, t16);
			append(div7, div3);
			append(div3, t17);
			append(div3, t18);
			append(div7, t19);
			append(div7, div6);
			append(div6, div4);
			append(div6, t21);
			append(div6, div5);
			append(div5, t22);
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

			if (('$variableStore' in changed || '_id' in changed) && promise !== (promise = ctx.$variableStore.filter(ctx.func).length) && handle_promise(promise, info)) ; else {
				info.block.p(changed, assign(assign({}, ctx), info.resolved));
			}

			if ((changed.earliestBeginOfDataGathering) && t13_value !== (t13_value = formatDate(ctx.earliestBeginOfDataGathering, false))) {
				set_data(t13, t13_value);
			}

			if ((changed.__created) && t18_value !== (t18_value = formatDate(ctx.__created))) {
				set_data(t18, t18_value);
			}

			if ((changed.selected) && t22_value !== (t22_value = ctx.selected ? 'unselect' : 'select')) {
				set_data(t22, t22_value);
			}

			if (changed.selected) {
				toggle_class(div7, "selected", ctx.selected);
			}
		},

		i: noop,
		o: noop,

		d: function destroy(detaching) {
			if (detaching) {
				detach(div7);
			}

			info.block.d();
			info.token = null;
			info = null;

			run_all(dispose);
		}
	};
}

function instance$d($$self, $$props, $$invalidate) {
	let $msgStore, $studyStore, $variableStore;

	validate_store(msgStore, 'msgStore');
	subscribe($$self, msgStore, $$value => { $msgStore = $$value; $$invalidate('$msgStore', $msgStore); });
	validate_store(studyStore, 'studyStore');
	subscribe($$self, studyStore, $$value => { $studyStore = $$value; $$invalidate('$studyStore', $studyStore); });
	validate_store(variableStore, 'variableStore');
	subscribe($$self, variableStore, $$value => { $variableStore = $$value; $$invalidate('$variableStore', $variableStore); });

	

  let { _id, studyName, description, tasks, __created, minimumStudyDurationPerPerson, maximumStudyDurationPerPerson, earliestBeginOfDataGathering, latestBeginOfDataGathering } = $$props;

  const studyId = _id;
  const dispatch = createEventDispatcher();
  function showVariables() {
    dispatch("showVariables", { studyId, studyName });
  }
  function showUsers() {
    dispatch("showUsers", { studyId, studyName });
  }
  function showResponses() {
    dispatch("showResponses", { studyId, studyName });
  }

  let selected = false;
  function selectStudy() {
    dispatch("selectStudy", { studyId, studyName });
    $$invalidate('selected', selected = !selected);
  }

  function showStudy() {
    const msg = {
      type: "navigation",
      action: "openStudyTabs",
      data: { _id, studyName }
    };
    $msgStore.push(msg);
    msgStore.set($msgStore); // make sure store gets updated
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

  function exportStudy() {
    const studyData = $studyStore.filter(v => v._id === studyId)[0];
    if (studyData) {
      console.log("export study", studyId);

      const res = db
        .transaction("StudyResponses")
        .objectStore("StudyResponses")
        .index("studyId")
        .getAll(studyId);
      res.onsuccess = e => {
        const taskResults = e.target.result;
        downloadAsJson(
          { dataSchema: studyData, taskResults },
          `export_study_${studyId}_${studyName.replace(/\s+/g, "_")}`
        );
      };
      res.onerror = e => {
        downloadAsJson(
          { dataSchema: studyData },
          `export_study_${studyId}_${studyName.replace(/\s+/g, "_")}`
        );
      };
    }
  }

	const writable_props = ['_id', 'studyName', 'description', 'tasks', '__created', 'minimumStudyDurationPerPerson', 'maximumStudyDurationPerPerson', 'earliestBeginOfDataGathering', 'latestBeginOfDataGathering'];
	Object.keys($$props).forEach(key => {
		if (!writable_props.includes(key) && !key.startsWith('$$')) console_1.warn(`<StudyCard> was created with unknown prop '${key}'`);
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
		selected,
		selectStudy,
		showStudy,
		responses,
		userCount,
		endDate,
		deleteStudy,
		exportStudy,
		$variableStore,
		func
	};
}

class StudyCard extends SvelteComponentDev {
	constructor(options) {
		super(options);
		init(this, options, instance$d, create_fragment$d, safe_not_equal, ["_id", "studyName", "description", "tasks", "__created", "minimumStudyDurationPerPerson", "maximumStudyDurationPerPerson", "earliestBeginOfDataGathering", "latestBeginOfDataGathering"]);

		const { ctx } = this.$$;
		const props = options.props || {};
		if (ctx._id === undefined && !('_id' in props)) {
			console_1.warn("<StudyCard> was created without expected prop '_id'");
		}
		if (ctx.studyName === undefined && !('studyName' in props)) {
			console_1.warn("<StudyCard> was created without expected prop 'studyName'");
		}
		if (ctx.description === undefined && !('description' in props)) {
			console_1.warn("<StudyCard> was created without expected prop 'description'");
		}
		if (ctx.tasks === undefined && !('tasks' in props)) {
			console_1.warn("<StudyCard> was created without expected prop 'tasks'");
		}
		if (ctx.__created === undefined && !('__created' in props)) {
			console_1.warn("<StudyCard> was created without expected prop '__created'");
		}
		if (ctx.minimumStudyDurationPerPerson === undefined && !('minimumStudyDurationPerPerson' in props)) {
			console_1.warn("<StudyCard> was created without expected prop 'minimumStudyDurationPerPerson'");
		}
		if (ctx.maximumStudyDurationPerPerson === undefined && !('maximumStudyDurationPerPerson' in props)) {
			console_1.warn("<StudyCard> was created without expected prop 'maximumStudyDurationPerPerson'");
		}
		if (ctx.earliestBeginOfDataGathering === undefined && !('earliestBeginOfDataGathering' in props)) {
			console_1.warn("<StudyCard> was created without expected prop 'earliestBeginOfDataGathering'");
		}
		if (ctx.latestBeginOfDataGathering === undefined && !('latestBeginOfDataGathering' in props)) {
			console_1.warn("<StudyCard> was created without expected prop 'latestBeginOfDataGathering'");
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

/* src\components\StudyVariables.svelte generated by Svelte v3.6.7 */

const file$e = "src\\components\\StudyVariables.svelte";

function get_each_context$3(ctx, list, i) {
	const child_ctx = Object.create(ctx);
	child_ctx.v = list[i];
	return child_ctx;
}

// (49:4) {#each $variableStore.filter(v => v.studyId == studyId) as v}
function create_each_block$3(ctx) {
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
			attr(td0, "class", "name svelte-vhmrc0");
			add_location(td0, file$e, 50, 8, 981);
			attr(td1, "class", "label svelte-vhmrc0");
			add_location(td1, file$e, 51, 8, 1029);
			attr(td2, "class", "measure svelte-vhmrc0");
			add_location(td2, file$e, 52, 8, 1079);
			attr(tr, "class", "svelte-vhmrc0");
			add_location(tr, file$e, 49, 6, 967);
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
			if ((changed.$variableStore || changed.studyId) && t0_value !== (t0_value = ctx.v.variableName)) {
				set_data(t0, t0_value);
			}

			if ((changed.$variableStore || changed.studyId) && t2_value !== (t2_value = ctx.v.variableLabel)) {
				set_data(t2, t2_value);
			}

			if ((changed.$variableStore || changed.studyId) && t4_value !== (t4_value = ucFirst(ctx.v.measure))) {
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

function create_fragment$e(ctx) {
	var div, p, t0, strong, t1, t2, table, tr, th0, t4, th1, t6, th2, t8;

	var each_value = ctx.$variableStore.filter(ctx.func);

	var each_blocks = [];

	for (var i = 0; i < each_value.length; i += 1) {
		each_blocks[i] = create_each_block$3(get_each_context$3(ctx, each_value, i));
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
			add_location(strong, file$e, 40, 4, 757);
			add_location(p, file$e, 38, 2, 730);
			attr(th0, "class", "svelte-vhmrc0");
			add_location(th0, file$e, 44, 6, 822);
			attr(th1, "class", "svelte-vhmrc0");
			add_location(th1, file$e, 45, 6, 843);
			attr(th2, "class", "svelte-vhmrc0");
			add_location(th2, file$e, 46, 6, 865);
			attr(tr, "class", "svelte-vhmrc0");
			add_location(tr, file$e, 43, 4, 810);
			attr(table, "class", "svelte-vhmrc0");
			add_location(table, file$e, 42, 2, 797);
			attr(div, "class", "container svelte-vhmrc0");
			add_location(div, file$e, 37, 0, 703);
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

			if (changed.ucFirst || changed.$variableStore || changed.studyId) {
				each_value = ctx.$variableStore.filter(ctx.func);

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

function ucFirst(string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
}

function instance$e($$self, $$props, $$invalidate) {
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
		init(this, options, instance$e, create_fragment$e, safe_not_equal, ["studyId", "studyName"]);
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

/* src\components\StudyUsers.svelte generated by Svelte v3.6.7 */

const file$f = "src\\components\\StudyUsers.svelte";

function get_each_context_1(ctx, list, i) {
	const child_ctx = Object.create(ctx);
	child_ctx.demo = list[i];
	return child_ctx;
}

function get_each_context$4(ctx, list, i) {
	const child_ctx = Object.create(ctx);
	child_ctx.data = list[i];
	return child_ctx;
}

// (74:12) {#each data[1].demographics as demo}
function create_each_block_1(ctx) {
	var tr, td0, t0_value = ctx.demo.variableName, t0, t1, t2, td1, t3_value = ctx.demo.value, t3, t4;

	return {
		c: function create() {
			tr = element("tr");
			td0 = element("td");
			t0 = text(t0_value);
			t1 = text(":");
			t2 = space();
			td1 = element("td");
			t3 = text(t3_value);
			t4 = space();
			attr(td0, "class", "svelte-vhmrc0");
			add_location(td0, file$f, 75, 16, 1612);
			attr(td1, "class", "svelte-vhmrc0");
			add_location(td1, file$f, 76, 16, 1659);
			attr(tr, "class", "svelte-vhmrc0");
			add_location(tr, file$f, 74, 14, 1590);
		},

		m: function mount(target, anchor) {
			insert(target, tr, anchor);
			append(tr, td0);
			append(td0, t0);
			append(td0, t1);
			append(tr, t2);
			append(tr, td1);
			append(td1, t3);
			append(tr, t4);
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
function create_each_block$4(ctx) {
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
			attr(td0, "class", "svelte-vhmrc0");
			add_location(td0, file$f, 70, 8, 1471);
			attr(table, "class", "svelte-vhmrc0");
			add_location(table, file$f, 72, 10, 1517);
			attr(td1, "class", "svelte-vhmrc0");
			add_location(td1, file$f, 71, 8, 1501);
			attr(tr, "class", "svelte-vhmrc0");
			add_location(tr, file$f, 69, 6, 1457);
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

function create_fragment$f(ctx) {
	var div, p, t0, strong, t1, t2, table, tr, th0, t4, th1, t6;

	var each_value = ctx.users;

	var each_blocks = [];

	for (var i = 0; i < each_value.length; i += 1) {
		each_blocks[i] = create_each_block$4(get_each_context$4(ctx, each_value, i));
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
			add_location(strong, file$f, 61, 4, 1301);
			add_location(p, file$f, 59, 2, 1278);
			attr(th0, "class", "svelte-vhmrc0");
			add_location(th0, file$f, 65, 6, 1366);
			attr(th1, "class", "svelte-vhmrc0");
			add_location(th1, file$f, 66, 6, 1390);
			attr(tr, "class", "svelte-vhmrc0");
			add_location(tr, file$f, 64, 4, 1354);
			attr(table, "class", "svelte-vhmrc0");
			add_location(table, file$f, 63, 2, 1341);
			attr(div, "class", "container svelte-vhmrc0");
			add_location(div, file$f, 58, 0, 1251);
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
					const child_ctx = get_each_context$4(ctx, each_value, i);

					if (each_blocks[i]) {
						each_blocks[i].p(changed, child_ctx);
					} else {
						each_blocks[i] = create_each_block$4(child_ctx);
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

function instance$f($$self, $$props, $$invalidate) {
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
		init(this, options, instance$f, create_fragment$f, safe_not_equal, ["studyId", "studyName"]);
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

/* src\components\StudyResponses.svelte generated by Svelte v3.6.7 */

const file$g = "src\\components\\StudyResponses.svelte";

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

function get_each_context$5(ctx, list, i) {
	const child_ctx = Object.create(ctx);
	child_ctx.response = list[i];
	return child_ctx;
}

// (73:14) {#each steps.stepItemResults as item}
function create_each_block_2(ctx) {
	var tr, td0, t0_value = ctx.item.variableName, t0, t1, t2, td1, t3_value = ctx.item.value, t3, t4;

	return {
		c: function create() {
			tr = element("tr");
			td0 = element("td");
			t0 = text(t0_value);
			t1 = text(":");
			t2 = space();
			td1 = element("td");
			t3 = text(t3_value);
			t4 = space();
			set_style(td0, "width", "65%");
			attr(td0, "class", "svelte-vhmrc0");
			add_location(td0, file$g, 74, 18, 1684);
			attr(td1, "class", "svelte-vhmrc0");
			add_location(td1, file$g, 75, 18, 1751);
			attr(tr, "class", "svelte-vhmrc0");
			add_location(tr, file$g, 73, 16, 1660);
		},

		m: function mount(target, anchor) {
			insert(target, tr, anchor);
			append(tr, td0);
			append(td0, t0);
			append(td0, t1);
			append(tr, t2);
			append(tr, td1);
			append(td1, t3);
			append(tr, t4);
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
function create_each_block$5(ctx) {
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
			attr(td0, "class", "svelte-vhmrc0");
			add_location(td0, file$g, 62, 8, 1249);
			attr(td1, "class", "svelte-vhmrc0");
			add_location(td1, file$g, 63, 8, 1285);
			add_location(br, file$g, 66, 10, 1407);
			attr(td2, "nowrap", "");
			attr(td2, "class", "svelte-vhmrc0");
			add_location(td2, file$g, 64, 8, 1323);
			set_style(table, "width", "100%");
			attr(table, "class", "svelte-vhmrc0");
			add_location(table, file$g, 70, 10, 1512);
			attr(td3, "class", "svelte-vhmrc0");
			add_location(td3, file$g, 69, 8, 1496);
			attr(tr, "class", "svelte-vhmrc0");
			add_location(tr, file$g, 61, 6, 1235);
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

function create_fragment$g(ctx) {
	var div, p, t0, strong, t1, t2, table, tr, th0, t4, th1, t6, th2, t8, th3, t10;

	var each_value = ctx.responses;

	var each_blocks = [];

	for (var i = 0; i < each_value.length; i += 1) {
		each_blocks[i] = create_each_block$5(get_each_context$5(ctx, each_value, i));
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
			add_location(strong, file$g, 51, 4, 1034);
			add_location(p, file$g, 49, 2, 1007);
			attr(th0, "class", "svelte-vhmrc0");
			add_location(th0, file$g, 55, 6, 1099);
			attr(th1, "class", "svelte-vhmrc0");
			add_location(th1, file$g, 56, 6, 1123);
			attr(th2, "class", "svelte-vhmrc0");
			add_location(th2, file$g, 57, 6, 1144);
			attr(th3, "class", "svelte-vhmrc0");
			add_location(th3, file$g, 58, 6, 1165);
			attr(tr, "class", "svelte-vhmrc0");
			add_location(tr, file$g, 54, 4, 1087);
			attr(table, "class", "svelte-vhmrc0");
			add_location(table, file$g, 53, 2, 1074);
			attr(div, "class", "container svelte-vhmrc0");
			add_location(div, file$g, 48, 0, 980);
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

function instance$g($$self, $$props, $$invalidate) {
	

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
		init(this, options, instance$g, create_fragment$g, safe_not_equal, ["studyId", "studyName"]);
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

/* src\components\StudyMerger.svelte generated by Svelte v3.6.7 */
const { console: console_1$1 } = globals;

const file$h = "src\\components\\StudyMerger.svelte";

function get_each_context$6(ctx, list, i) {
	const child_ctx = Object.create(ctx);
	child_ctx.name = list[i];
	return child_ctx;
}

function get_each_context_1$2(ctx, list, i) {
	const child_ctx = Object.create(ctx);
	child_ctx.study = list[i];
	return child_ctx;
}

// (81:4) {#each selectedStudies as study}
function create_each_block_1$2(ctx) {
	var li, t_value = ctx.study.studyName, t;

	return {
		c: function create() {
			li = element("li");
			t = text(t_value);
			add_location(li, file$h, 81, 6, 2071);
		},

		m: function mount(target, anchor) {
			insert(target, li, anchor);
			append(li, t);
		},

		p: function update(changed, ctx) {
			if ((changed.selectedStudies) && t_value !== (t_value = ctx.study.studyName)) {
				set_data(t, t_value);
			}
		},

		d: function destroy(detaching) {
			if (detaching) {
				detach(li);
			}
		}
	};
}

// (95:4) {#each [...mergedVariableNames] as name}
function create_each_block$6(ctx) {
	var li, input, input_id_value, input_value_value, t0, label, t1_value = ctx.name, t1, label_for_value, t2, dispose;

	return {
		c: function create() {
			li = element("li");
			input = element("input");
			t0 = space();
			label = element("label");
			t1 = text(t1_value);
			t2 = space();
			ctx.$$binding_groups[0].push(input);
			attr(input, "id", input_id_value = ctx.name);
			attr(input, "type", "checkbox");
			input.__value = input_value_value = ctx.name;
			input.value = input.__value;
			attr(input, "class", "svelte-1amgvg3");
			add_location(input, file$h, 96, 8, 2428);
			attr(label, "for", label_for_value = ctx.name);
			attr(label, "class", "svelte-1amgvg3");
			add_location(label, file$h, 101, 8, 2561);
			add_location(li, file$h, 95, 6, 2414);
			dispose = listen(input, "change", ctx.input_change_handler);
		},

		m: function mount(target, anchor) {
			insert(target, li, anchor);
			append(li, input);

			input.checked = ~ctx.selectedVariables.indexOf(input.__value);

			append(li, t0);
			append(li, label);
			append(label, t1);
			append(li, t2);
		},

		p: function update(changed, ctx) {
			if (changed.selectedVariables) input.checked = ~ctx.selectedVariables.indexOf(input.__value);

			if ((changed.mergedVariableNames) && input_id_value !== (input_id_value = ctx.name)) {
				attr(input, "id", input_id_value);
			}

			if ((changed.mergedVariableNames) && input_value_value !== (input_value_value = ctx.name)) {
				input.__value = input_value_value;
			}

			input.value = input.__value;

			if ((changed.mergedVariableNames) && t1_value !== (t1_value = ctx.name)) {
				set_data(t1, t1_value);
			}

			if ((changed.mergedVariableNames) && label_for_value !== (label_for_value = ctx.name)) {
				attr(label, "for", label_for_value);
			}
		},

		d: function destroy(detaching) {
			if (detaching) {
				detach(li);
			}

			ctx.$$binding_groups[0].splice(ctx.$$binding_groups[0].indexOf(input), 1);
			dispose();
		}
	};
}

function create_fragment$h(ctx) {
	var div1, p0, t0, strong, t2, ul0, t3, input, t4, p1, t6, ul1, t7, div0, dispose;

	var each_value_1 = ctx.selectedStudies;

	var each_blocks_1 = [];

	for (var i = 0; i < each_value_1.length; i += 1) {
		each_blocks_1[i] = create_each_block_1$2(get_each_context_1$2(ctx, each_value_1, i));
	}

	var each_value = [...ctx.mergedVariableNames];

	var each_blocks = [];

	for (var i = 0; i < each_value.length; i += 1) {
		each_blocks[i] = create_each_block$6(get_each_context$6(ctx, each_value, i));
	}

	return {
		c: function create() {
			div1 = element("div");
			p0 = element("p");
			t0 = text("Create New\r\n    ");
			strong = element("strong");
			strong.textContent = "Study";
			t2 = text("\r\n  Combine the following studies\r\n  ");
			ul0 = element("ul");

			for (var i = 0; i < each_blocks_1.length; i += 1) {
				each_blocks_1[i].c();
			}

			t3 = text("\r\n  into new study:\r\n  ");
			input = element("input");
			t4 = space();
			p1 = element("p");
			p1.textContent = "Include variables (that appear in all selected studies):";
			t6 = space();
			ul1 = element("ul");

			for (var i = 0; i < each_blocks.length; i += 1) {
				each_blocks[i].c();
			}

			t7 = space();
			div0 = element("div");
			div0.textContent = "Create Study";
			add_location(strong, file$h, 76, 4, 1954);
			add_location(p0, file$h, 74, 2, 1929);
			add_location(ul0, file$h, 79, 2, 2021);
			attr(input, "type", "text");
			attr(input, "placeholder", "New Study Name");
			input.autofocus = true;
			attr(input, "spellcheck", "false");
			attr(input, "class", "svelte-1amgvg3");
			add_location(input, file$h, 85, 2, 2142);
			add_location(p1, file$h, 92, 2, 2273);
			attr(ul1, "class", "varList svelte-1amgvg3");
			add_location(ul1, file$h, 93, 2, 2340);
			attr(div0, "class", "create svelte-1amgvg3");
			toggle_class(div0, "disabled", ctx.disabled);
			add_location(div0, file$h, 105, 2, 2632);
			attr(div1, "class", "container svelte-1amgvg3");
			add_location(div1, file$h, 73, 0, 1902);
			dispose = listen(input, "input", ctx.input_input_handler);
		},

		l: function claim(nodes) {
			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
		},

		m: function mount(target, anchor) {
			insert(target, div1, anchor);
			append(div1, p0);
			append(p0, t0);
			append(p0, strong);
			append(div1, t2);
			append(div1, ul0);

			for (var i = 0; i < each_blocks_1.length; i += 1) {
				each_blocks_1[i].m(ul0, null);
			}

			append(div1, t3);
			append(div1, input);

			input.value = ctx.newName;

			append(div1, t4);
			append(div1, p1);
			append(div1, t6);
			append(div1, ul1);

			for (var i = 0; i < each_blocks.length; i += 1) {
				each_blocks[i].m(ul1, null);
			}

			append(div1, t7);
			append(div1, div0);
			input.focus();
		},

		p: function update(changed, ctx) {
			if (changed.selectedStudies) {
				each_value_1 = ctx.selectedStudies;

				for (var i = 0; i < each_value_1.length; i += 1) {
					const child_ctx = get_each_context_1$2(ctx, each_value_1, i);

					if (each_blocks_1[i]) {
						each_blocks_1[i].p(changed, child_ctx);
					} else {
						each_blocks_1[i] = create_each_block_1$2(child_ctx);
						each_blocks_1[i].c();
						each_blocks_1[i].m(ul0, null);
					}
				}

				for (; i < each_blocks_1.length; i += 1) {
					each_blocks_1[i].d(1);
				}
				each_blocks_1.length = each_value_1.length;
			}

			if (changed.newName && (input.value !== ctx.newName)) input.value = ctx.newName;

			if (changed.mergedVariableNames || changed.selectedVariables) {
				each_value = [...ctx.mergedVariableNames];

				for (var i = 0; i < each_value.length; i += 1) {
					const child_ctx = get_each_context$6(ctx, each_value, i);

					if (each_blocks[i]) {
						each_blocks[i].p(changed, child_ctx);
					} else {
						each_blocks[i] = create_each_block$6(child_ctx);
						each_blocks[i].c();
						each_blocks[i].m(ul1, null);
					}
				}

				for (; i < each_blocks.length; i += 1) {
					each_blocks[i].d(1);
				}
				each_blocks.length = each_value.length;
			}

			if (changed.disabled) {
				toggle_class(div0, "disabled", ctx.disabled);
			}
		},

		i: noop,
		o: noop,

		d: function destroy(detaching) {
			if (detaching) {
				detach(div1);
			}

			destroy_each(each_blocks_1, detaching);

			destroy_each(each_blocks, detaching);

			dispose();
		}
	};
}

function instance$h($$self, $$props, $$invalidate) {
	let $variableStore;

	validate_store(variableStore, 'variableStore');
	subscribe($$self, variableStore, $$value => { $variableStore = $$value; $$invalidate('$variableStore', $variableStore); });

	let { selectedStudies = [] } = $$props;
  let newName = "";
  let mergedVariableNames = new Set();
  let selectedVariables = [];
  if (selectedStudies.length) {
    const studyId = selectedStudies[0].studyId;
    // get variables of 1st study
    const variables = $variableStore.filter(v => v.studyId === studyId);
    $$invalidate('mergedVariableNames', mergedVariableNames = new Set(variables.map(v => v.variableName)));
    for (const study of selectedStudies) {
      const variables = $variableStore.filter(v => v.studyId === study.studyId);
      const varNames = new Set(variables.map(v => v.variableName));

      // intersect with set of other variables
      $$invalidate('mergedVariableNames', mergedVariableNames = new Set(
        [...mergedVariableNames].filter(v => varNames.has(v))
      ));
    }
    console.log(mergedVariableNames);
    $$invalidate('selectedVariables', selectedVariables = [...mergedVariableNames]);
  }

	const writable_props = ['selectedStudies'];
	Object.keys($$props).forEach(key => {
		if (!writable_props.includes(key) && !key.startsWith('$$')) console_1$1.warn(`<StudyMerger> was created with unknown prop '${key}'`);
	});

	const $$binding_groups = [[]];

	function input_input_handler() {
		newName = this.value;
		$$invalidate('newName', newName);
	}

	function input_change_handler() {
		selectedVariables = get_binding_group_value($$binding_groups[0]);
		$$invalidate('selectedVariables', selectedVariables);
	}

	$$self.$set = $$props => {
		if ('selectedStudies' in $$props) $$invalidate('selectedStudies', selectedStudies = $$props.selectedStudies);
	};

	let disabled;

	$$self.$$.update = ($$dirty = { newName: 1 }) => {
		if ($$dirty.newName) { $$invalidate('disabled', disabled = newName.trim().length ? false : true); }
	};

	return {
		selectedStudies,
		newName,
		mergedVariableNames,
		selectedVariables,
		disabled,
		input_input_handler,
		input_change_handler,
		$$binding_groups
	};
}

class StudyMerger extends SvelteComponentDev {
	constructor(options) {
		super(options);
		init(this, options, instance$h, create_fragment$h, safe_not_equal, ["selectedStudies"]);
	}

	get selectedStudies() {
		throw new Error("<StudyMerger>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set selectedStudies(value) {
		throw new Error("<StudyMerger>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}
}

/* src\views\StudyList.svelte generated by Svelte v3.6.7 */
const { window: window_1 } = globals;

const file$i = "src\\views\\StudyList.svelte";

function get_each_context$7(ctx, list, i) {
	const child_ctx = Object.create(ctx);
	child_ctx.study = list[i];
	return child_ctx;
}

// (192:0) {#if toggleNewStudy}
function create_if_block_5(ctx) {
	var div1, t, div0, div1_transition, current, dispose;

	var studymerger = new StudyMerger({
		props: { selectedStudies: ctx.selectedStudies },
		$$inline: true
	});

	return {
		c: function create() {
			div1 = element("div");
			studymerger.$$.fragment.c();
			t = space();
			div0 = element("div");
			div0.textContent = "x close";
			attr(div0, "class", "close svelte-1bzpjta");
			add_location(div0, file$i, 194, 4, 5240);
			attr(div1, "class", "varInfo svelte-1bzpjta");
			add_location(div1, file$i, 192, 2, 5130);
			dispose = listen(div0, "click", ctx.click_handler);
		},

		m: function mount(target, anchor) {
			insert(target, div1, anchor);
			mount_component(studymerger, div1, null);
			append(div1, t);
			append(div1, div0);
			current = true;
		},

		p: function update(changed, ctx) {
			var studymerger_changes = {};
			if (changed.selectedStudies) studymerger_changes.selectedStudies = ctx.selectedStudies;
			studymerger.$set(studymerger_changes);
		},

		i: function intro(local) {
			if (current) return;
			transition_in(studymerger.$$.fragment, local);

			add_render_callback(() => {
				if (!div1_transition) div1_transition = create_bidirectional_transition(div1, fly, { x: -200, duration: 200 }, true);
				div1_transition.run(1);
			});

			current = true;
		},

		o: function outro(local) {
			transition_out(studymerger.$$.fragment, local);

			if (!div1_transition) div1_transition = create_bidirectional_transition(div1, fly, { x: -200, duration: 200 }, false);
			div1_transition.run(0);

			current = false;
		},

		d: function destroy(detaching) {
			if (detaching) {
				detach(div1);
			}

			destroy_component(studymerger, );

			if (detaching) {
				if (div1_transition) div1_transition.end();
			}

			dispose();
		}
	};
}

// (199:0) {#if toggleVars}
function create_if_block_4(ctx) {
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
			attr(div0, "class", "close svelte-1bzpjta");
			add_location(div0, file$i, 201, 4, 5465);
			attr(div1, "class", "varInfo svelte-1bzpjta");
			add_location(div1, file$i, 199, 2, 5355);
			dispose = listen(div0, "click", ctx.click_handler_1);
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
			transition_in(studyvariables.$$.fragment, local);

			add_render_callback(() => {
				if (!div1_transition) div1_transition = create_bidirectional_transition(div1, fly, { x: -200, duration: 200 }, true);
				div1_transition.run(1);
			});

			current = true;
		},

		o: function outro(local) {
			transition_out(studyvariables.$$.fragment, local);

			if (!div1_transition) div1_transition = create_bidirectional_transition(div1, fly, { x: -200, duration: 200 }, false);
			div1_transition.run(0);

			current = false;
		},

		d: function destroy(detaching) {
			if (detaching) {
				detach(div1);
			}

			destroy_component(studyvariables, );

			if (detaching) {
				if (div1_transition) div1_transition.end();
			}

			dispose();
		}
	};
}

// (206:0) {#if toggleUsers}
function create_if_block_3(ctx) {
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
			attr(div0, "class", "close svelte-1bzpjta");
			add_location(div0, file$i, 208, 4, 5683);
			attr(div1, "class", "varInfo svelte-1bzpjta");
			add_location(div1, file$i, 206, 2, 5577);
			dispose = listen(div0, "click", ctx.click_handler_2);
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
			transition_in(studyusers.$$.fragment, local);

			add_render_callback(() => {
				if (!div1_transition) div1_transition = create_bidirectional_transition(div1, fly, { x: -200, duration: 200 }, true);
				div1_transition.run(1);
			});

			current = true;
		},

		o: function outro(local) {
			transition_out(studyusers.$$.fragment, local);

			if (!div1_transition) div1_transition = create_bidirectional_transition(div1, fly, { x: -200, duration: 200 }, false);
			div1_transition.run(0);

			current = false;
		},

		d: function destroy(detaching) {
			if (detaching) {
				detach(div1);
			}

			destroy_component(studyusers, );

			if (detaching) {
				if (div1_transition) div1_transition.end();
			}

			dispose();
		}
	};
}

// (213:0) {#if toggleResponses}
function create_if_block_2$1(ctx) {
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
			attr(div0, "class", "close svelte-1bzpjta");
			add_location(div0, file$i, 215, 4, 5910);
			attr(div1, "class", "varInfo svelte-1bzpjta");
			add_location(div1, file$i, 213, 2, 5800);
			dispose = listen(div0, "click", ctx.click_handler_3);
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
			transition_in(studyresponses.$$.fragment, local);

			add_render_callback(() => {
				if (!div1_transition) div1_transition = create_bidirectional_transition(div1, fly, { x: -200, duration: 200 }, true);
				div1_transition.run(1);
			});

			current = true;
		},

		o: function outro(local) {
			transition_out(studyresponses.$$.fragment, local);

			if (!div1_transition) div1_transition = create_bidirectional_transition(div1, fly, { x: -200, duration: 200 }, false);
			div1_transition.run(0);

			current = false;
		},

		d: function destroy(detaching) {
			if (detaching) {
				detach(div1);
			}

			destroy_component(studyresponses, );

			if (detaching) {
				if (div1_transition) div1_transition.end();
			}

			dispose();
		}
	};
}

// (220:2) {#if studyCount}
function create_if_block_1$1(ctx) {
	var span, t0_value = ctx.studyCount < 2 ? ctx.studyCount + ' study' : ctx.studyCount + ' studies', t0, t1;

	return {
		c: function create() {
			span = element("span");
			t0 = text(t0_value);
			t1 = text(":");
			attr(span, "class", "info svelte-1bzpjta");
			add_location(span, file$i, 220, 4, 6051);
		},

		m: function mount(target, anchor) {
			insert(target, span, anchor);
			append(span, t0);
			append(span, t1);
		},

		p: function update(changed, ctx) {
			if ((changed.studyCount) && t0_value !== (t0_value = ctx.studyCount < 2 ? ctx.studyCount + ' study' : ctx.studyCount + ' studies')) {
				set_data(t0, t0_value);
			}
		},

		d: function destroy(detaching) {
			if (detaching) {
				detach(span);
			}
		}
	};
}

// (225:2) {#if selectedStudies.length}
function create_if_block$2(ctx) {
	var span, div0, t0, t1_value = ctx.selectedStudies.length, t1, t2, t3, div1, t4, t5_value = ctx.selectedStudies.length, t5, t6, t7, div2, t8, t9_value = ctx.selectedStudies.length, t9, t10, span_transition, current, dispose;

	return {
		c: function create() {
			span = element("span");
			div0 = element("div");
			t0 = text("create new study from selected (");
			t1 = text(t1_value);
			t2 = text(")");
			t3 = space();
			div1 = element("div");
			t4 = text("open selected (");
			t5 = text(t5_value);
			t6 = text(")");
			t7 = space();
			div2 = element("div");
			t8 = text("export selected studies (");
			t9 = text(t9_value);
			t10 = text(")");
			attr(div0, "class", "action new svelte-1bzpjta");
			toggle_class(div0, "disabled", ctx.disabled);
			add_location(div0, file$i, 226, 6, 6284);
			attr(div1, "class", "action open svelte-1bzpjta");
			toggle_class(div1, "disabled", ctx.disabled);
			add_location(div1, file$i, 229, 6, 6445);
			attr(div2, "class", "action export svelte-1bzpjta");
			toggle_class(div2, "disabled", ctx.disabled);
			add_location(div2, file$i, 232, 6, 6581);
			attr(span, "class", "selectActions svelte-1bzpjta");
			add_location(span, file$i, 225, 4, 6205);

			dispose = [
				listen(div0, "click", ctx.createNewFromSelected),
				listen(div1, "click", ctx.openSelected),
				listen(div2, "click", ctx.exportSelected)
			];
		},

		m: function mount(target, anchor) {
			insert(target, span, anchor);
			append(span, div0);
			append(div0, t0);
			append(div0, t1);
			append(div0, t2);
			append(span, t3);
			append(span, div1);
			append(div1, t4);
			append(div1, t5);
			append(div1, t6);
			append(span, t7);
			append(span, div2);
			append(div2, t8);
			append(div2, t9);
			append(div2, t10);
			current = true;
		},

		p: function update(changed, ctx) {
			if ((!current || changed.selectedStudies) && t1_value !== (t1_value = ctx.selectedStudies.length)) {
				set_data(t1, t1_value);
			}

			if (changed.disabled) {
				toggle_class(div0, "disabled", ctx.disabled);
			}

			if ((!current || changed.selectedStudies) && t5_value !== (t5_value = ctx.selectedStudies.length)) {
				set_data(t5, t5_value);
			}

			if (changed.disabled) {
				toggle_class(div1, "disabled", ctx.disabled);
			}

			if ((!current || changed.selectedStudies) && t9_value !== (t9_value = ctx.selectedStudies.length)) {
				set_data(t9, t9_value);
			}

			if (changed.disabled) {
				toggle_class(div2, "disabled", ctx.disabled);
			}
		},

		i: function intro(local) {
			if (current) return;
			add_render_callback(() => {
				if (!span_transition) span_transition = create_bidirectional_transition(span, fly, { duration: 200, x: -10 }, true);
				span_transition.run(1);
			});

			current = true;
		},

		o: function outro(local) {
			if (!span_transition) span_transition = create_bidirectional_transition(span, fly, { duration: 200, x: -10 }, false);
			span_transition.run(0);

			current = false;
		},

		d: function destroy(detaching) {
			if (detaching) {
				detach(span);
				if (span_transition) span_transition.end();
			}

			run_all(dispose);
		}
	};
}

// (241:2) {#each $studyStore as study (study._id)}
function create_each_block$7(key_1, ctx) {
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
	studycard.$on("selectStudy", ctx.selectStudy);

	return {
		key: key_1,

		first: null,

		c: function create() {
			div = element("div");
			studycard.$$.fragment.c();
			attr(div, "class", "study svelte-1bzpjta");
			add_location(div, file$i, 241, 4, 6858);
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
			transition_in(studycard.$$.fragment, local);

			if (!div_intro) {
				add_render_callback(() => {
					div_intro = create_in_transition(div, fly, { duration: 300, y: -100 });
					div_intro.start();
				});
			}

			current = true;
		},

		o: function outro(local) {
			transition_out(studycard.$$.fragment, local);
			current = false;
		},

		d: function destroy(detaching) {
			if (detaching) {
				detach(div);
			}

			destroy_component(studycard, );
		}
	};
}

function create_fragment$i(ctx) {
	var t0, t1, t2, t3, div0, t4, t5, div2, each_blocks = [], each_1_lookup = new Map(), t6, div1, div2_intro, t7, div3, current, dispose;

	var if_block0 = (ctx.toggleNewStudy) && create_if_block_5(ctx);

	var if_block1 = (ctx.toggleVars) && create_if_block_4(ctx);

	var if_block2 = (ctx.toggleUsers) && create_if_block_3(ctx);

	var if_block3 = (ctx.toggleResponses) && create_if_block_2$1(ctx);

	var if_block4 = (ctx.studyCount) && create_if_block_1$1(ctx);

	var if_block5 = (ctx.selectedStudies.length) && create_if_block$2(ctx);

	var each_value = ctx.$studyStore;

	const get_key = ctx => ctx.study._id;

	for (var i = 0; i < each_value.length; i += 1) {
		let child_ctx = get_each_context$7(ctx, each_value, i);
		let key = get_key(child_ctx);
		each_1_lookup.set(key, each_blocks[i] = create_each_block$7(key, child_ctx));
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
			if (if_block3) if_block3.c();
			t3 = space();
			div0 = element("div");
			if (if_block4) if_block4.c();
			t4 = space();
			if (if_block5) if_block5.c();
			t5 = space();
			div2 = element("div");

			for (i = 0; i < each_blocks.length; i += 1) each_blocks[i].c();

			t6 = space();
			div1 = element("div");
			studyimporter.$$.fragment.c();
			t7 = space();
			div3 = element("div");
			div3.textContent = "Debug: wipe database";
			attr(div0, "class", "actions svelte-1bzpjta");
			add_location(div0, file$i, 218, 0, 6004);
			attr(div1, "class", "study svelte-1bzpjta");
			add_location(div1, file$i, 253, 2, 7186);
			attr(div2, "class", "container svelte-1bzpjta");
			add_location(div2, file$i, 239, 0, 6757);
			attr(div3, "class", "debug svelte-1bzpjta");
			add_location(div3, file$i, 258, 0, 7250);

			dispose = [
				listen(window_1, "keyup", ctx.closeDetailView),
				listen(div3, "click", dropDB)
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
			if (if_block3) if_block3.m(target, anchor);
			insert(target, t3, anchor);
			insert(target, div0, anchor);
			if (if_block4) if_block4.m(div0, null);
			append(div0, t4);
			if (if_block5) if_block5.m(div0, null);
			insert(target, t5, anchor);
			insert(target, div2, anchor);

			for (i = 0; i < each_blocks.length; i += 1) each_blocks[i].m(div2, null);

			append(div2, t6);
			append(div2, div1);
			mount_component(studyimporter, div1, null);
			insert(target, t7, anchor);
			insert(target, div3, anchor);
			current = true;
		},

		p: function update(changed, ctx) {
			if (ctx.toggleNewStudy) {
				if (if_block0) {
					if_block0.p(changed, ctx);
					transition_in(if_block0, 1);
				} else {
					if_block0 = create_if_block_5(ctx);
					if_block0.c();
					transition_in(if_block0, 1);
					if_block0.m(t0.parentNode, t0);
				}
			} else if (if_block0) {
				group_outros();
				transition_out(if_block0, 1, 1, () => {
					if_block0 = null;
				});
				check_outros();
			}

			if (ctx.toggleVars) {
				if (if_block1) {
					if_block1.p(changed, ctx);
					transition_in(if_block1, 1);
				} else {
					if_block1 = create_if_block_4(ctx);
					if_block1.c();
					transition_in(if_block1, 1);
					if_block1.m(t1.parentNode, t1);
				}
			} else if (if_block1) {
				group_outros();
				transition_out(if_block1, 1, 1, () => {
					if_block1 = null;
				});
				check_outros();
			}

			if (ctx.toggleUsers) {
				if (if_block2) {
					if_block2.p(changed, ctx);
					transition_in(if_block2, 1);
				} else {
					if_block2 = create_if_block_3(ctx);
					if_block2.c();
					transition_in(if_block2, 1);
					if_block2.m(t2.parentNode, t2);
				}
			} else if (if_block2) {
				group_outros();
				transition_out(if_block2, 1, 1, () => {
					if_block2 = null;
				});
				check_outros();
			}

			if (ctx.toggleResponses) {
				if (if_block3) {
					if_block3.p(changed, ctx);
					transition_in(if_block3, 1);
				} else {
					if_block3 = create_if_block_2$1(ctx);
					if_block3.c();
					transition_in(if_block3, 1);
					if_block3.m(t3.parentNode, t3);
				}
			} else if (if_block3) {
				group_outros();
				transition_out(if_block3, 1, 1, () => {
					if_block3 = null;
				});
				check_outros();
			}

			if (ctx.studyCount) {
				if (if_block4) {
					if_block4.p(changed, ctx);
				} else {
					if_block4 = create_if_block_1$1(ctx);
					if_block4.c();
					if_block4.m(div0, t4);
				}
			} else if (if_block4) {
				if_block4.d(1);
				if_block4 = null;
			}

			if (ctx.selectedStudies.length) {
				if (if_block5) {
					if_block5.p(changed, ctx);
					transition_in(if_block5, 1);
				} else {
					if_block5 = create_if_block$2(ctx);
					if_block5.c();
					transition_in(if_block5, 1);
					if_block5.m(div0, null);
				}
			} else if (if_block5) {
				group_outros();
				transition_out(if_block5, 1, 1, () => {
					if_block5 = null;
				});
				check_outros();
			}

			const each_value = ctx.$studyStore;

			group_outros();
			for (let i = 0; i < each_blocks.length; i += 1) each_blocks[i].r();
			each_blocks = update_keyed_each(each_blocks, changed, get_key, 1, ctx, each_value, each_1_lookup, div2, fix_and_outro_and_destroy_block, create_each_block$7, t6, get_each_context$7);
			for (let i = 0; i < each_blocks.length; i += 1) each_blocks[i].a();
			check_outros();
		},

		i: function intro(local) {
			if (current) return;
			transition_in(if_block0);
			transition_in(if_block1);
			transition_in(if_block2);
			transition_in(if_block3);
			transition_in(if_block5);

			for (var i = 0; i < each_value.length; i += 1) transition_in(each_blocks[i]);

			transition_in(studyimporter.$$.fragment, local);

			if (!div2_intro) {
				add_render_callback(() => {
					div2_intro = create_in_transition(div2, fade, { duration: 300 });
					div2_intro.start();
				});
			}

			current = true;
		},

		o: function outro(local) {
			transition_out(if_block0);
			transition_out(if_block1);
			transition_out(if_block2);
			transition_out(if_block3);
			transition_out(if_block5);

			for (i = 0; i < each_blocks.length; i += 1) transition_out(each_blocks[i]);

			transition_out(studyimporter.$$.fragment, local);
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
			}

			if (if_block3) if_block3.d(detaching);

			if (detaching) {
				detach(t3);
				detach(div0);
			}

			if (if_block4) if_block4.d();
			if (if_block5) if_block5.d();

			if (detaching) {
				detach(t5);
				detach(div2);
			}

			for (i = 0; i < each_blocks.length; i += 1) each_blocks[i].d();

			destroy_component(studyimporter, );

			if (detaching) {
				detach(t7);
				detach(div3);
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

function instance$i($$self, $$props, $$invalidate) {
	let $studyStore, $responseStore, $msgStore;

	validate_store(studyStore, 'studyStore');
	subscribe($$self, studyStore, $$value => { $studyStore = $$value; $$invalidate('$studyStore', $studyStore); });
	validate_store(responseStore, 'responseStore');
	subscribe($$self, responseStore, $$value => { $responseStore = $$value; $$invalidate('$responseStore', $responseStore); });
	validate_store(msgStore, 'msgStore');
	subscribe($$self, msgStore, $$value => { $msgStore = $$value; $$invalidate('$msgStore', $msgStore); });

	

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
      $$invalidate('toggleNewStudy', toggleNewStudy = false);
    }
  }

  let selectedStudies = [];
  function selectStudy(event) {
    const study = event.detail;
    const studyId = study.studyId;
    let alreadySelected = false;
    for (const studyItem of selectedStudies) {
      if (studyItem.studyId === studyId) {
        alreadySelected = true;
        $$invalidate('selectedStudies', selectedStudies = selectedStudies.filter(v => v.studyId !== studyId));
        break;
      }
    }
    if (alreadySelected) return;
    selectedStudies.push(study);
    $$invalidate('selectedStudies', selectedStudies);
  }

  function exportSelected() {
    if (!selectedStudies.length) return;
    const exportData = [];
    for (const study of selectedStudies) {
      const studyData = $studyStore.filter(v => v._id === study.studyId)[0];
      const taskResults = $responseStore.filter(
        v => v.studyId === study.studyId
      );
      exportData.push({ dataSchema: studyData, taskResults });
    }
    downloadAsJson(exportData, `export_of_${selectedStudies.length}_studies`);
  }

  function openSelected() {
    if (!selectedStudies.length) return;
    for (const study of selectedStudies) {
      const _id = study.studyId;
      const studyName = study.studyName;
      const msg = {
        type: "navigation",
        action: "openStudyTabs",
        data: { _id, studyName }
      };
      $msgStore.push(msg);
    }
    msgStore.set($msgStore); // make sure store gets updated
  }

  let toggleNewStudy = false;
  function createNewFromSelected() {
    if (!selectedStudies.length) return;
    $$invalidate('toggleNewStudy', toggleNewStudy = true);
  }

	function click_handler() {
		const $$result = (toggleNewStudy = false);
		$$invalidate('toggleNewStudy', toggleNewStudy);
		return $$result;
	}

	function click_handler_1() {
		const $$result = (toggleVars = false);
		$$invalidate('toggleVars', toggleVars);
		return $$result;
	}

	function click_handler_2() {
		const $$result = (toggleUsers = false);
		$$invalidate('toggleUsers', toggleUsers);
		return $$result;
	}

	function click_handler_3() {
		const $$result = (toggleResponses = false);
		$$invalidate('toggleResponses', toggleResponses);
		return $$result;
	}

	let disabled, studyCount;

	$$self.$$.update = ($$dirty = { selectedStudies: 1, $studyStore: 1 }) => {
		if ($$dirty.selectedStudies) { $$invalidate('disabled', disabled = selectedStudies.length ? false : true); }
		if ($$dirty.selectedStudies) { if (selectedStudies.length) {
        console.log("show study actions", selectedStudies);
      } }
		if ($$dirty.$studyStore) { $$invalidate('studyCount', studyCount = $studyStore.length); }
	};

	return {
		studyData,
		toggleVars,
		showVars,
		toggleUsers,
		showUsers,
		toggleResponses,
		showResponses,
		closeDetailView,
		selectedStudies,
		selectStudy,
		exportSelected,
		openSelected,
		toggleNewStudy,
		createNewFromSelected,
		disabled,
		studyCount,
		$studyStore,
		click_handler,
		click_handler_1,
		click_handler_2,
		click_handler_3
	};
}

class StudyList extends SvelteComponentDev {
	constructor(options) {
		super(options);
		init(this, options, instance$i, create_fragment$i, safe_not_equal, []);
	}
}

/* src\charts\VariableNominalChart.svelte generated by Svelte v3.6.7 */

const file$j = "src\\charts\\VariableNominalChart.svelte";

function create_fragment$j(ctx) {
	var div;

	return {
		c: function create() {
			div = element("div");
			attr(div, "id", ctx.chartId);
			add_location(div, file$j, 52, 0, 1422);
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

function instance$j($$self, $$props, $$invalidate) {
	
  let { variable } = $$props;
  const variableName = variable.variableName;
  const chartId = `vis${variableName}nominal`;

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
    title: { text: variableName, fontSize: 12 },
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
        axis: { domain: false, titleFontWeight: 300 }
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
		init(this, options, instance$j, create_fragment$j, safe_not_equal, ["variable"]);

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

/* src\charts\VariableScaleChart.svelte generated by Svelte v3.6.7 */

const file$k = "src\\charts\\VariableScaleChart.svelte";

function create_fragment$k(ctx) {
	var div;

	return {
		c: function create() {
			div = element("div");
			attr(div, "id", ctx.chartId);
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

function instance$k($$self, $$props, $$invalidate) {
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
		init(this, options, instance$k, create_fragment$k, safe_not_equal, ["variable"]);

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

/* src\charts\VariableQualitativeChart.svelte generated by Svelte v3.6.7 */

const file$l = "src\\charts\\VariableQualitativeChart.svelte";

function get_each_context_2$1(ctx, list, i) {
	const child_ctx = Object.create(ctx);
	child_ctx.item = list[i];
	return child_ctx;
}

function get_each_context_1$3(ctx, list, i) {
	const child_ctx = Object.create(ctx);
	child_ctx.step = list[i];
	return child_ctx;
}

function get_each_context$8(ctx, list, i) {
	const child_ctx = Object.create(ctx);
	child_ctx.result = list[i];
	return child_ctx;
}

// (52:6) {:else}
function create_else_block_2(ctx) {
	var th0, t_1, th1;

	return {
		c: function create() {
			th0 = element("th");
			th0.textContent = "User";
			t_1 = space();
			th1 = element("th");
			th1.textContent = "Date";
			attr(th0, "class", "svelte-194yb9w");
			add_location(th0, file$l, 52, 8, 966);
			attr(th1, "class", "svelte-194yb9w");
			add_location(th1, file$l, 53, 8, 989);
		},

		m: function mount(target, anchor) {
			insert(target, th0, anchor);
			insert(target, t_1, anchor);
			insert(target, th1, anchor);
		},

		d: function destroy(detaching) {
			if (detaching) {
				detach(th0);
				detach(t_1);
				detach(th1);
			}
		}
	};
}

// (50:6) {#if details}
function create_if_block_3$1(ctx) {
	var th;

	return {
		c: function create() {
			th = element("th");
			th.textContent = "other responses";
			attr(th, "colspan", "10");
			attr(th, "class", "svelte-194yb9w");
			add_location(th, file$l, 50, 8, 904);
		},

		m: function mount(target, anchor) {
			insert(target, th, anchor);
		},

		d: function destroy(detaching) {
			if (detaching) {
				detach(th);
			}
		}
	};
}

// (76:2) {:else}
function create_else_block_1(ctx) {
	var t;

	return {
		c: function create() {
			t = text("No answers given yet");
		},

		m: function mount(target, anchor) {
			insert(target, t, anchor);
		},

		d: function destroy(detaching) {
			if (detaching) {
				detach(t);
			}
		}
	};
}

// (59:4) {#if result.value.trim().length}
function create_if_block$3(ctx) {
	var tr, td, t0_value = ctx.result.value, t0, t1, t2;

	function select_block_type_1(ctx) {
		if (ctx.details) return create_if_block_1$2;
		return create_else_block$2;
	}

	var current_block_type = select_block_type_1(ctx);
	var if_block = current_block_type(ctx);

	return {
		c: function create() {
			tr = element("tr");
			td = element("td");
			t0 = text(t0_value);
			t1 = space();
			if_block.c();
			t2 = space();
			attr(td, "class", "svelte-194yb9w");
			add_location(td, file$l, 60, 8, 1136);
			attr(tr, "class", "svelte-194yb9w");
			add_location(tr, file$l, 59, 6, 1122);
		},

		m: function mount(target, anchor) {
			insert(target, tr, anchor);
			append(tr, td);
			append(td, t0);
			append(tr, t1);
			if_block.m(tr, null);
			append(tr, t2);
		},

		p: function update(changed, ctx) {
			if ((changed.variable) && t0_value !== (t0_value = ctx.result.value)) {
				set_data(t0, t0_value);
			}

			if (current_block_type === (current_block_type = select_block_type_1(ctx)) && if_block) {
				if_block.p(changed, ctx);
			} else {
				if_block.d(1);
				if_block = current_block_type(ctx);
				if (if_block) {
					if_block.c();
					if_block.m(tr, t2);
				}
			}
		},

		d: function destroy(detaching) {
			if (detaching) {
				detach(tr);
			}

			if_block.d();
		}
	};
}

// (70:8) {:else}
function create_else_block$2(ctx) {
	var td0, t0_value = trunc(ctx.result.uid), t0, t1, td1, t2_value = formatDate(ctx.result.date), t2;

	return {
		c: function create() {
			td0 = element("td");
			t0 = text(t0_value);
			t1 = space();
			td1 = element("td");
			t2 = text(t2_value);
			attr(td0, "class", "svelte-194yb9w");
			add_location(td0, file$l, 70, 10, 1513);
			attr(td1, "class", "svelte-194yb9w");
			add_location(td1, file$l, 71, 10, 1553);
		},

		m: function mount(target, anchor) {
			insert(target, td0, anchor);
			append(td0, t0);
			insert(target, t1, anchor);
			insert(target, td1, anchor);
			append(td1, t2);
		},

		p: function update(changed, ctx) {
			if ((changed.variable) && t0_value !== (t0_value = trunc(ctx.result.uid))) {
				set_data(t0, t0_value);
			}

			if ((changed.variable) && t2_value !== (t2_value = formatDate(ctx.result.date))) {
				set_data(t2, t2_value);
			}
		},

		d: function destroy(detaching) {
			if (detaching) {
				detach(td0);
				detach(t1);
				detach(td1);
			}
		}
	};
}

// (62:8) {#if details}
function create_if_block_1$2(ctx) {
	var each_1_anchor;

	var each_value_1 = ctx.result.taskResults.stepResults;

	var each_blocks = [];

	for (var i = 0; i < each_value_1.length; i += 1) {
		each_blocks[i] = create_each_block_1$3(get_each_context_1$3(ctx, each_value_1, i));
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
			if (changed.variable || changed.trunc) {
				each_value_1 = ctx.result.taskResults.stepResults;

				for (var i = 0; i < each_value_1.length; i += 1) {
					const child_ctx = get_each_context_1$3(ctx, each_value_1, i);

					if (each_blocks[i]) {
						each_blocks[i].p(changed, child_ctx);
					} else {
						each_blocks[i] = create_each_block_1$3(child_ctx);
						each_blocks[i].c();
						each_blocks[i].m(each_1_anchor.parentNode, each_1_anchor);
					}
				}

				for (; i < each_blocks.length; i += 1) {
					each_blocks[i].d(1);
				}
				each_blocks.length = each_value_1.length;
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

// (65:14) {#if item.variableName !== variable.variableName}
function create_if_block_2$2(ctx) {
	var td, t0_value = ctx.item.value, t0, t1, t2_value = trunc(ctx.item.variableName), t2, t3;

	return {
		c: function create() {
			td = element("td");
			t0 = text(t0_value);
			t1 = text(" (");
			t2 = text(t2_value);
			t3 = text(")");
			attr(td, "class", "svelte-194yb9w");
			add_location(td, file$l, 65, 16, 1373);
		},

		m: function mount(target, anchor) {
			insert(target, td, anchor);
			append(td, t0);
			append(td, t1);
			append(td, t2);
			append(td, t3);
		},

		p: function update(changed, ctx) {
			if ((changed.variable) && t0_value !== (t0_value = ctx.item.value)) {
				set_data(t0, t0_value);
			}

			if ((changed.variable) && t2_value !== (t2_value = trunc(ctx.item.variableName))) {
				set_data(t2, t2_value);
			}
		},

		d: function destroy(detaching) {
			if (detaching) {
				detach(td);
			}
		}
	};
}

// (64:12) {#each step.stepItemResults as item}
function create_each_block_2$1(ctx) {
	var if_block_anchor;

	var if_block = (ctx.item.variableName !== ctx.variable.variableName) && create_if_block_2$2(ctx);

	return {
		c: function create() {
			if (if_block) if_block.c();
			if_block_anchor = empty();
		},

		m: function mount(target, anchor) {
			if (if_block) if_block.m(target, anchor);
			insert(target, if_block_anchor, anchor);
		},

		p: function update(changed, ctx) {
			if (ctx.item.variableName !== ctx.variable.variableName) {
				if (if_block) {
					if_block.p(changed, ctx);
				} else {
					if_block = create_if_block_2$2(ctx);
					if_block.c();
					if_block.m(if_block_anchor.parentNode, if_block_anchor);
				}
			} else if (if_block) {
				if_block.d(1);
				if_block = null;
			}
		},

		d: function destroy(detaching) {
			if (if_block) if_block.d(detaching);

			if (detaching) {
				detach(if_block_anchor);
			}
		}
	};
}

// (63:10) {#each result.taskResults.stepResults as step}
function create_each_block_1$3(ctx) {
	var each_1_anchor;

	var each_value_2 = ctx.step.stepItemResults;

	var each_blocks = [];

	for (var i = 0; i < each_value_2.length; i += 1) {
		each_blocks[i] = create_each_block_2$1(get_each_context_2$1(ctx, each_value_2, i));
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
			if (changed.variable || changed.trunc) {
				each_value_2 = ctx.step.stepItemResults;

				for (var i = 0; i < each_value_2.length; i += 1) {
					const child_ctx = get_each_context_2$1(ctx, each_value_2, i);

					if (each_blocks[i]) {
						each_blocks[i].p(changed, child_ctx);
					} else {
						each_blocks[i] = create_each_block_2$1(child_ctx);
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

// (58:2) {#each variable.results as result}
function create_each_block$8(ctx) {
	var if_block_anchor;

	var if_block = (ctx.result.value.trim().length) && create_if_block$3(ctx);

	return {
		c: function create() {
			if (if_block) if_block.c();
			if_block_anchor = empty();
		},

		m: function mount(target, anchor) {
			if (if_block) if_block.m(target, anchor);
			insert(target, if_block_anchor, anchor);
		},

		p: function update(changed, ctx) {
			if (ctx.result.value.trim().length) {
				if (if_block) {
					if_block.p(changed, ctx);
				} else {
					if_block = create_if_block$3(ctx);
					if_block.c();
					if_block.m(if_block_anchor.parentNode, if_block_anchor);
				}
			} else if (if_block) {
				if_block.d(1);
				if_block = null;
			}
		},

		d: function destroy(detaching) {
			if (if_block) if_block.d(detaching);

			if (detaching) {
				detach(if_block_anchor);
			}
		}
	};
}

function create_fragment$l(ctx) {
	var label, input, t0, u, t1, t2_value = ctx.details ? 'less' : 'more', t2, t3, t4, table, thead, tr, th, t6, t7, dispose;

	function select_block_type(ctx) {
		if (ctx.details) return create_if_block_3$1;
		return create_else_block_2;
	}

	var current_block_type = select_block_type(ctx);
	var if_block = current_block_type(ctx);

	var each_value = ctx.variable.results;

	var each_blocks = [];

	for (var i = 0; i < each_value.length; i += 1) {
		each_blocks[i] = create_each_block$8(get_each_context$8(ctx, each_value, i));
	}

	var each_1_else = null;

	if (!each_value.length) {
		each_1_else = create_else_block_1();
		each_1_else.c();
	}

	return {
		c: function create() {
			label = element("label");
			input = element("input");
			t0 = space();
			u = element("u");
			t1 = text("Show ");
			t2 = text(t2_value);
			t3 = text(" data");
			t4 = space();
			table = element("table");
			thead = element("thead");
			tr = element("tr");
			th = element("th");
			th.textContent = "Answer";
			t6 = space();
			if_block.c();
			t7 = space();

			for (var i = 0; i < each_blocks.length; i += 1) {
				each_blocks[i].c();
			}
			attr(input, "type", "checkbox");
			attr(input, "id", "showmore");
			attr(input, "class", "svelte-194yb9w");
			add_location(input, file$l, 41, 2, 698);
			add_location(u, file$l, 42, 2, 764);
			attr(label, "for", "showmore");
			attr(label, "class", "svelte-194yb9w");
			add_location(label, file$l, 40, 0, 672);
			attr(th, "class", "svelte-194yb9w");
			add_location(th, file$l, 47, 6, 856);
			attr(tr, "class", "svelte-194yb9w");
			add_location(tr, file$l, 46, 4, 844);
			attr(thead, "class", "svelte-194yb9w");
			add_location(thead, file$l, 45, 2, 831);
			attr(table, "class", "svelte-194yb9w");
			add_location(table, file$l, 44, 0, 820);
			dispose = listen(input, "change", ctx.input_change_handler);
		},

		l: function claim(nodes) {
			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
		},

		m: function mount(target, anchor) {
			insert(target, label, anchor);
			append(label, input);

			input.checked = ctx.details;

			append(label, t0);
			append(label, u);
			append(u, t1);
			append(u, t2);
			append(u, t3);
			insert(target, t4, anchor);
			insert(target, table, anchor);
			append(table, thead);
			append(thead, tr);
			append(tr, th);
			append(tr, t6);
			if_block.m(tr, null);
			append(table, t7);

			for (var i = 0; i < each_blocks.length; i += 1) {
				each_blocks[i].m(table, null);
			}

			if (each_1_else) {
				each_1_else.m(table, null);
			}
		},

		p: function update(changed, ctx) {
			if (changed.details) input.checked = ctx.details;

			if ((changed.details) && t2_value !== (t2_value = ctx.details ? 'less' : 'more')) {
				set_data(t2, t2_value);
			}

			if (current_block_type !== (current_block_type = select_block_type(ctx))) {
				if_block.d(1);
				if_block = current_block_type(ctx);
				if (if_block) {
					if_block.c();
					if_block.m(tr, null);
				}
			}

			if (changed.variable || changed.details || changed.trunc || changed.formatDate) {
				each_value = ctx.variable.results;

				for (var i = 0; i < each_value.length; i += 1) {
					const child_ctx = get_each_context$8(ctx, each_value, i);

					if (each_blocks[i]) {
						each_blocks[i].p(changed, child_ctx);
					} else {
						each_blocks[i] = create_each_block$8(child_ctx);
						each_blocks[i].c();
						each_blocks[i].m(table, null);
					}
				}

				for (; i < each_blocks.length; i += 1) {
					each_blocks[i].d(1);
				}
				each_blocks.length = each_value.length;
			}

			if (each_value.length) {
				if (each_1_else) {
					each_1_else.d(1);
					each_1_else = null;
				}
			} else if (!each_1_else) {
				each_1_else = create_else_block_1();
				each_1_else.c();
				each_1_else.m(table, null);
			}
		},

		i: noop,
		o: noop,

		d: function destroy(detaching) {
			if (detaching) {
				detach(label);
				detach(t4);
				detach(table);
			}

			if_block.d();

			destroy_each(each_blocks, detaching);

			if (each_1_else) each_1_else.d();

			dispose();
		}
	};
}

function instance$l($$self, $$props, $$invalidate) {
	let { variable = {} } = $$props;
  let details = false;

	const writable_props = ['variable'];
	Object.keys($$props).forEach(key => {
		if (!writable_props.includes(key) && !key.startsWith('$$')) console.warn(`<VariableQualitativeChart> was created with unknown prop '${key}'`);
	});

	function input_change_handler() {
		details = this.checked;
		$$invalidate('details', details);
	}

	$$self.$set = $$props => {
		if ('variable' in $$props) $$invalidate('variable', variable = $$props.variable);
	};

	return { variable, details, input_change_handler };
}

class VariableQualitativeChart extends SvelteComponentDev {
	constructor(options) {
		super(options);
		init(this, options, instance$l, create_fragment$l, safe_not_equal, ["variable"]);
	}

	get variable() {
		throw new Error("<VariableQualitativeChart>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set variable(value) {
		throw new Error("<VariableQualitativeChart>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}
}

/* src\components\VariableStats.svelte generated by Svelte v3.6.7 */

const file$m = "src\\components\\VariableStats.svelte";

function get_each_context$9(ctx, list, i) {
	const child_ctx = Object.create(ctx);
	child_ctx.choice = list[i];
	return child_ctx;
}

// (79:4) {#if variable.measure == 'nominal'}
function create_if_block_7(ctx) {
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
			transition_in(variablenominalchart.$$.fragment, local);

			current = true;
		},

		o: function outro(local) {
			transition_out(variablenominalchart.$$.fragment, local);
			current = false;
		},

		d: function destroy(detaching) {
			destroy_component(variablenominalchart, detaching);
		}
	};
}

// (82:4) {#if variable.measure == 'scale'}
function create_if_block_6(ctx) {
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
			transition_in(variablescalechart.$$.fragment, local);

			current = true;
		},

		o: function outro(local) {
			transition_out(variablescalechart.$$.fragment, local);
			current = false;
		},

		d: function destroy(detaching) {
			destroy_component(variablescalechart, detaching);
		}
	};
}

// (90:4) {#if variable.dataformat.hasOwnProperty('textChoices')}
function create_if_block_5$1(ctx) {
	var div, h4, t_1, table;

	var each_value = ctx.variable.dataformat.textChoices;

	var each_blocks = [];

	for (var i = 0; i < each_value.length; i += 1) {
		each_blocks[i] = create_each_block$9(get_each_context$9(ctx, each_value, i));
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
			attr(h4, "class", "svelte-etrkc7");
			add_location(h4, file$m, 91, 8, 2110);
			attr(table, "class", "svelte-etrkc7");
			add_location(table, file$m, 92, 8, 2143);
			attr(div, "class", "choices svelte-etrkc7");
			add_location(div, file$m, 90, 6, 2079);
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
					const child_ctx = get_each_context$9(ctx, each_value, i);

					if (each_blocks[i]) {
						each_blocks[i].p(changed, child_ctx);
					} else {
						each_blocks[i] = create_each_block$9(child_ctx);
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

// (94:10) {#each variable.dataformat.textChoices as choice}
function create_each_block$9(ctx) {
	var tr, td, t0, t1_value = ctx.choice.value, t1, t2, t3_value = ctx.choice.valueLabel || ctx.choice.text, t3, t4;

	return {
		c: function create() {
			tr = element("tr");
			td = element("td");
			t0 = text("(");
			t1 = text(t1_value);
			t2 = text(") ");
			t3 = text(t3_value);
			t4 = space();
			attr(td, "class", "svelte-etrkc7");
			add_location(td, file$m, 95, 14, 2245);
			attr(tr, "class", "svelte-etrkc7");
			add_location(tr, file$m, 94, 12, 2225);
		},

		m: function mount(target, anchor) {
			insert(target, tr, anchor);
			append(tr, td);
			append(td, t0);
			append(td, t1);
			append(td, t2);
			append(td, t3);
			append(tr, t4);
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

// (109:8) {#if variable.measure == 'scale' || variable.measure == 'ordinal'}
function create_if_block_4$1(ctx) {
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
			attr(td0, "class", "svelte-etrkc7");
			add_location(td0, file$m, 110, 12, 2679);
			attr(td1, "class", "svelte-etrkc7");
			add_location(td1, file$m, 111, 12, 2712);
			attr(tr, "class", "svelte-etrkc7");
			add_location(tr, file$m, 109, 10, 2661);
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

		p: function update(changed, ctx) {
			if ((changed.data) && t2_value !== (t2_value = simpleStatistics_min.min(ctx.data))) {
				set_data(t2, t2_value);
			}

			if ((changed.data) && t4_value !== (t4_value = simpleStatistics_min.max(ctx.data))) {
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

// (119:8) {#if variable.measure == 'scale' || variable.measure == 'ordinal'}
function create_if_block_3$2(ctx) {
	var tr, td0, t1, td1, t2_value = simpleStatistics_min.median(ctx.data), t2;

	return {
		c: function create() {
			tr = element("tr");
			td0 = element("td");
			td0.textContent = "Median:";
			t1 = space();
			td1 = element("td");
			t2 = text(t2_value);
			attr(td0, "class", "svelte-etrkc7");
			add_location(td0, file$m, 120, 12, 2991);
			attr(td1, "class", "svelte-etrkc7");
			add_location(td1, file$m, 121, 12, 3021);
			attr(tr, "class", "svelte-etrkc7");
			add_location(tr, file$m, 119, 10, 2973);
		},

		m: function mount(target, anchor) {
			insert(target, tr, anchor);
			append(tr, td0);
			append(tr, t1);
			append(tr, td1);
			append(td1, t2);
		},

		p: function update(changed, ctx) {
			if ((changed.data) && t2_value !== (t2_value = simpleStatistics_min.median(ctx.data))) {
				set_data(t2, t2_value);
			}
		},

		d: function destroy(detaching) {
			if (detaching) {
				detach(tr);
			}
		}
	};
}

// (125:8) {#if variable.measure == 'scale'}
function create_if_block_2$3(ctx) {
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
			attr(td0, "class", "svelte-etrkc7");
			add_location(td0, file$m, 126, 12, 3154);
			attr(td1, "class", "svelte-etrkc7");
			add_location(td1, file$m, 127, 12, 3182);
			attr(tr, "class", "svelte-etrkc7");
			add_location(tr, file$m, 125, 10, 3136);
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

		p: function update(changed, ctx) {
			if ((changed.data) && t2_value !== (t2_value = simpleStatistics_min.mean(ctx.data).toFixed(4))) {
				set_data(t2, t2_value);
			}

			if ((changed.data) && t4_value !== (t4_value = simpleStatistics_min
                .standardDeviation(ctx.data)
                .toFixed(4))) {
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

// (135:8) {#if variable.measure == 'qualitative'}
function create_if_block_1$3(ctx) {
	var tr, td0, t1, td1, t2_value = simpleStatistics_min.min(ctx.data.map(func)), t2, t3, span0, t5, t6_value = simpleStatistics_min.mean(ctx.data.map(func_1)), t6, t7, span1, t9, t10_value = simpleStatistics_min.max(ctx.data.map(func_2)), t10, t11;

	return {
		c: function create() {
			tr = element("tr");
			td0 = element("td");
			td0.textContent = "Text length:";
			t1 = space();
			td1 = element("td");
			t2 = text(t2_value);
			t3 = text(" (min)\r\n              ");
			span0 = element("span");
			span0.textContent = "|";
			t5 = space();
			t6 = text(t6_value);
			t7 = text(" (avg)\r\n              ");
			span1 = element("span");
			span1.textContent = "|";
			t9 = space();
			t10 = text(t10_value);
			t11 = text(" (max)");
			attr(td0, "class", "svelte-etrkc7");
			add_location(td0, file$m, 136, 12, 3445);
			attr(span0, "class", "sep svelte-etrkc7");
			add_location(span0, file$m, 139, 14, 3557);
			attr(span1, "class", "sep svelte-etrkc7");
			add_location(span1, file$m, 141, 14, 3657);
			attr(td1, "class", "svelte-etrkc7");
			add_location(td1, file$m, 137, 12, 3480);
			attr(tr, "class", "svelte-etrkc7");
			add_location(tr, file$m, 135, 10, 3427);
		},

		m: function mount(target, anchor) {
			insert(target, tr, anchor);
			append(tr, td0);
			append(tr, t1);
			append(tr, td1);
			append(td1, t2);
			append(td1, t3);
			append(td1, span0);
			append(td1, t5);
			append(td1, t6);
			append(td1, t7);
			append(td1, span1);
			append(td1, t9);
			append(td1, t10);
			append(td1, t11);
		},

		p: function update(changed, ctx) {
			if ((changed.data) && t2_value !== (t2_value = simpleStatistics_min.min(ctx.data.map(func)))) {
				set_data(t2, t2_value);
			}

			if ((changed.data) && t6_value !== (t6_value = simpleStatistics_min.mean(ctx.data.map(func_1)))) {
				set_data(t6, t6_value);
			}

			if ((changed.data) && t10_value !== (t10_value = simpleStatistics_min.max(ctx.data.map(func_2)))) {
				set_data(t10, t10_value);
			}
		},

		d: function destroy(detaching) {
			if (detaching) {
				detach(tr);
			}
		}
	};
}

// (148:6) {#if variable.measure == 'qualitative'}
function create_if_block$4(ctx) {
	var h4, t_1, div, current;

	var variablequalitativechart = new VariableQualitativeChart({
		props: { variable: ctx.variable },
		$$inline: true
	});

	return {
		c: function create() {
			h4 = element("h4");
			h4.textContent = "Answers given by users";
			t_1 = space();
			div = element("div");
			variablequalitativechart.$$.fragment.c();
			attr(h4, "class", "svelte-etrkc7");
			add_location(h4, file$m, 148, 8, 3864);
			attr(div, "class", "answerLog svelte-etrkc7");
			add_location(div, file$m, 149, 8, 3905);
		},

		m: function mount(target, anchor) {
			insert(target, h4, anchor);
			insert(target, t_1, anchor);
			insert(target, div, anchor);
			mount_component(variablequalitativechart, div, null);
			current = true;
		},

		p: function update(changed, ctx) {
			var variablequalitativechart_changes = {};
			if (changed.variable) variablequalitativechart_changes.variable = ctx.variable;
			variablequalitativechart.$set(variablequalitativechart_changes);
		},

		i: function intro(local) {
			if (current) return;
			transition_in(variablequalitativechart.$$.fragment, local);

			current = true;
		},

		o: function outro(local) {
			transition_out(variablequalitativechart.$$.fragment, local);
			current = false;
		},

		d: function destroy(detaching) {
			if (detaching) {
				detach(h4);
				detach(t_1);
				detach(div);
			}

			destroy_component(variablequalitativechart, );
		}
	};
}

function create_fragment$m(ctx) {
	var div6, div0, t0, t1, div5, div1, t2_value = ctx.variable.variableName, t2, t3, div2, t4_value = ctx.variable.variableLabel, t4, t5, div3, t6_value = uc(ctx.variable.measure), t6, t7, t8, div4, h4, t10, table, tr0, td0, t12, td1, t13_value = ctx.data.length, t13, t14, t15, tr1, td2, t17, td3, t18_value = simpleStatistics_min.modeFast(ctx.data), t18, t19, t20, t21, t22, current;

	var if_block0 = (ctx.variable.measure == 'nominal') && create_if_block_7(ctx);

	var if_block1 = (ctx.variable.measure == 'scale') && create_if_block_6(ctx);

	var if_block2 = (ctx.variable.dataformat.hasOwnProperty('textChoices')) && create_if_block_5$1(ctx);

	var if_block3 = (ctx.variable.measure == 'scale' || ctx.variable.measure == 'ordinal') && create_if_block_4$1(ctx);

	var if_block4 = (ctx.variable.measure == 'scale' || ctx.variable.measure == 'ordinal') && create_if_block_3$2(ctx);

	var if_block5 = (ctx.variable.measure == 'scale') && create_if_block_2$3(ctx);

	var if_block6 = (ctx.variable.measure == 'qualitative') && create_if_block_1$3(ctx);

	var if_block7 = (ctx.variable.measure == 'qualitative') && create_if_block$4(ctx);

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
			t21 = space();
			if (if_block6) if_block6.c();
			t22 = space();
			if (if_block7) if_block7.c();
			attr(div0, "class", "charts svelte-etrkc7");
			add_location(div0, file$m, 77, 2, 1609);
			attr(div1, "class", "name");
			add_location(div1, file$m, 86, 4, 1853);
			attr(div2, "class", "label svelte-etrkc7");
			add_location(div2, file$m, 87, 4, 1906);
			attr(div3, "class", "measure svelte-etrkc7");
			add_location(div3, file$m, 88, 4, 1961);
			attr(h4, "class", "svelte-etrkc7");
			add_location(h4, file$m, 102, 6, 2419);
			set_style(td0, "width", "22ch");
			attr(td0, "class", "svelte-etrkc7");
			add_location(td0, file$m, 105, 10, 2479);
			attr(td1, "class", "svelte-etrkc7");
			add_location(td1, file$m, 106, 10, 2536);
			attr(tr0, "class", "svelte-etrkc7");
			add_location(tr0, file$m, 104, 8, 2463);
			attr(td2, "class", "svelte-etrkc7");
			add_location(td2, file$m, 115, 10, 2814);
			attr(td3, "class", "svelte-etrkc7");
			add_location(td3, file$m, 116, 10, 2840);
			attr(tr1, "class", "svelte-etrkc7");
			add_location(tr1, file$m, 114, 8, 2798);
			attr(table, "class", "svelte-etrkc7");
			add_location(table, file$m, 103, 6, 2446);
			attr(div4, "class", "stats");
			add_location(div4, file$m, 101, 4, 2392);
			attr(div5, "class", "text");
			add_location(div5, file$m, 85, 2, 1829);
			attr(div6, "class", "card svelte-etrkc7");
			add_location(div6, file$m, 76, 0, 1587);
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
			append(table, t21);
			if (if_block6) if_block6.m(table, null);
			append(div4, t22);
			if (if_block7) if_block7.m(div4, null);
			current = true;
		},

		p: function update(changed, ctx) {
			if (ctx.variable.measure == 'nominal') {
				if (if_block0) {
					if_block0.p(changed, ctx);
					transition_in(if_block0, 1);
				} else {
					if_block0 = create_if_block_7(ctx);
					if_block0.c();
					transition_in(if_block0, 1);
					if_block0.m(div0, t0);
				}
			} else if (if_block0) {
				group_outros();
				transition_out(if_block0, 1, 1, () => {
					if_block0 = null;
				});
				check_outros();
			}

			if (ctx.variable.measure == 'scale') {
				if (if_block1) {
					if_block1.p(changed, ctx);
					transition_in(if_block1, 1);
				} else {
					if_block1 = create_if_block_6(ctx);
					if_block1.c();
					transition_in(if_block1, 1);
					if_block1.m(div0, null);
				}
			} else if (if_block1) {
				group_outros();
				transition_out(if_block1, 1, 1, () => {
					if_block1 = null;
				});
				check_outros();
			}

			if ((!current || changed.variable) && t2_value !== (t2_value = ctx.variable.variableName)) {
				set_data(t2, t2_value);
			}

			if ((!current || changed.variable) && t4_value !== (t4_value = ctx.variable.variableLabel)) {
				set_data(t4, t4_value);
			}

			if ((!current || changed.variable) && t6_value !== (t6_value = uc(ctx.variable.measure))) {
				set_data(t6, t6_value);
			}

			if (ctx.variable.dataformat.hasOwnProperty('textChoices')) {
				if (if_block2) {
					if_block2.p(changed, ctx);
				} else {
					if_block2 = create_if_block_5$1(ctx);
					if_block2.c();
					if_block2.m(div5, t8);
				}
			} else if (if_block2) {
				if_block2.d(1);
				if_block2 = null;
			}

			if ((!current || changed.data) && t13_value !== (t13_value = ctx.data.length)) {
				set_data(t13, t13_value);
			}

			if (ctx.variable.measure == 'scale' || ctx.variable.measure == 'ordinal') {
				if (if_block3) {
					if_block3.p(changed, ctx);
				} else {
					if_block3 = create_if_block_4$1(ctx);
					if_block3.c();
					if_block3.m(table, t15);
				}
			} else if (if_block3) {
				if_block3.d(1);
				if_block3 = null;
			}

			if ((!current || changed.data) && t18_value !== (t18_value = simpleStatistics_min.modeFast(ctx.data))) {
				set_data(t18, t18_value);
			}

			if (ctx.variable.measure == 'scale' || ctx.variable.measure == 'ordinal') {
				if (if_block4) {
					if_block4.p(changed, ctx);
				} else {
					if_block4 = create_if_block_3$2(ctx);
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
					if_block5 = create_if_block_2$3(ctx);
					if_block5.c();
					if_block5.m(table, t21);
				}
			} else if (if_block5) {
				if_block5.d(1);
				if_block5 = null;
			}

			if (ctx.variable.measure == 'qualitative') {
				if (if_block6) {
					if_block6.p(changed, ctx);
				} else {
					if_block6 = create_if_block_1$3(ctx);
					if_block6.c();
					if_block6.m(table, null);
				}
			} else if (if_block6) {
				if_block6.d(1);
				if_block6 = null;
			}

			if (ctx.variable.measure == 'qualitative') {
				if (if_block7) {
					if_block7.p(changed, ctx);
					transition_in(if_block7, 1);
				} else {
					if_block7 = create_if_block$4(ctx);
					if_block7.c();
					transition_in(if_block7, 1);
					if_block7.m(div4, null);
				}
			} else if (if_block7) {
				group_outros();
				transition_out(if_block7, 1, 1, () => {
					if_block7 = null;
				});
				check_outros();
			}
		},

		i: function intro(local) {
			if (current) return;
			transition_in(if_block0);
			transition_in(if_block1);
			transition_in(if_block7);
			current = true;
		},

		o: function outro(local) {
			transition_out(if_block0);
			transition_out(if_block1);
			transition_out(if_block7);
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
			if (if_block6) if_block6.d();
			if (if_block7) if_block7.d();
		}
	};
}

function func(v) {
	return v.length;
}

function func_1(v) {
	return v.length;
}

function func_2(v) {
	return v.length;
}

function instance$m($$self, $$props, $$invalidate) {
	

  let { variable = {} } = $$props;

	const writable_props = ['variable'];
	Object.keys($$props).forEach(key => {
		if (!writable_props.includes(key) && !key.startsWith('$$')) console.warn(`<VariableStats> was created with unknown prop '${key}'`);
	});

	$$self.$set = $$props => {
		if ('variable' in $$props) $$invalidate('variable', variable = $$props.variable);
	};

	let data;

	$$self.$$.update = ($$dirty = { variable: 1 }) => {
		if ($$dirty.variable) { $$invalidate('data', data = variable.results.map(v => v.value)); }
	};

	return { variable, data };
}

class VariableStats extends SvelteComponentDev {
	constructor(options) {
		super(options);
		init(this, options, instance$m, create_fragment$m, safe_not_equal, ["variable"]);
	}

	get variable() {
		throw new Error("<VariableStats>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set variable(value) {
		throw new Error("<VariableStats>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}
}

/* src\views\Descriptives.svelte generated by Svelte v3.6.7 */

const file$n = "src\\views\\Descriptives.svelte";

function get_each_context$a(ctx, list, i) {
	const child_ctx = Object.create(ctx);
	child_ctx.variable = list[i];
	return child_ctx;
}

function get_each_context_1$4(ctx, list, i) {
	const child_ctx = Object.create(ctx);
	child_ctx.option = list[i];
	child_ctx.i = i;
	return child_ctx;
}

// (93:4) {#each filterOptions as option, i}
function create_each_block_1$4(ctx) {
	var input, input_value_value, t0, label, t1_value = ctx.option, t1, dispose;

	return {
		c: function create() {
			input = element("input");
			t0 = space();
			label = element("label");
			t1 = text(t1_value);
			ctx.$$binding_groups[0].push(input);
			attr(input, "id", ctx.i);
			attr(input, "type", "checkbox");
			input.__value = input_value_value = ctx.option;
			input.value = input.__value;
			attr(input, "class", "svelte-1olr9uo");
			add_location(input, file$n, 93, 6, 2162);
			attr(label, "for", ctx.i);
			attr(label, "class", "svelte-1olr9uo");
			add_location(label, file$n, 99, 6, 2303);

			dispose = [
				listen(input, "change", ctx.input_change_handler),
				listen(input, "change", ctx.filter)
			];
		},

		m: function mount(target, anchor) {
			insert(target, input, anchor);

			input.checked = ~ctx.selected.indexOf(input.__value);

			insert(target, t0, anchor);
			insert(target, label, anchor);
			append(label, t1);
		},

		p: function update(changed, ctx) {
			if (changed.selected) input.checked = ~ctx.selected.indexOf(input.__value);
			input.value = input.__value;
		},

		d: function destroy(detaching) {
			if (detaching) {
				detach(input);
			}

			ctx.$$binding_groups[0].splice(ctx.$$binding_groups[0].indexOf(input), 1);

			if (detaching) {
				detach(t0);
				detach(label);
			}

			run_all(dispose);
		}
	};
}

// (105:4) {#each variables as variable}
function create_each_block$a(ctx) {
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
			if (changed.variables) varstats_changes.variable = ctx.variable;
			varstats.$set(varstats_changes);
		},

		i: function intro(local) {
			if (current) return;
			transition_in(varstats.$$.fragment, local);

			current = true;
		},

		o: function outro(local) {
			transition_out(varstats.$$.fragment, local);
			current = false;
		},

		d: function destroy(detaching) {
			destroy_component(varstats, detaching);
		}
	};
}

function create_fragment$n(ctx) {
	var div2, div0, span, t0_value = ctx.variables.length, t0, t1, t2, t3, div1, div2_intro, current;

	var each_value_1 = ctx.filterOptions;

	var each_blocks_1 = [];

	for (var i = 0; i < each_value_1.length; i += 1) {
		each_blocks_1[i] = create_each_block_1$4(get_each_context_1$4(ctx, each_value_1, i));
	}

	var each_value = ctx.variables;

	var each_blocks = [];

	for (var i = 0; i < each_value.length; i += 1) {
		each_blocks[i] = create_each_block$a(get_each_context$a(ctx, each_value, i));
	}

	const out = i => transition_out(each_blocks[i], 1, 1, () => {
		each_blocks[i] = null;
	});

	return {
		c: function create() {
			div2 = element("div");
			div0 = element("div");
			span = element("span");
			t0 = text(t0_value);
			t1 = text(" Variables:");
			t2 = space();

			for (var i = 0; i < each_blocks_1.length; i += 1) {
				each_blocks_1[i].c();
			}

			t3 = space();
			div1 = element("div");

			for (var i = 0; i < each_blocks.length; i += 1) {
				each_blocks[i].c();
			}
			attr(span, "class", "svelte-1olr9uo");
			add_location(span, file$n, 91, 4, 2072);
			attr(div0, "class", "filter svelte-1olr9uo");
			add_location(div0, file$n, 90, 2, 2046);
			attr(div1, "class", "stats svelte-1olr9uo");
			add_location(div1, file$n, 103, 2, 2363);
			attr(div2, "class", "container svelte-1olr9uo");
			add_location(div2, file$n, 89, 0, 1991);
		},

		l: function claim(nodes) {
			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
		},

		m: function mount(target, anchor) {
			insert(target, div2, anchor);
			append(div2, div0);
			append(div0, span);
			append(span, t0);
			append(span, t1);
			append(div0, t2);

			for (var i = 0; i < each_blocks_1.length; i += 1) {
				each_blocks_1[i].m(div0, null);
			}

			append(div2, t3);
			append(div2, div1);

			for (var i = 0; i < each_blocks.length; i += 1) {
				each_blocks[i].m(div1, null);
			}

			current = true;
		},

		p: function update(changed, ctx) {
			if ((!current || changed.variables) && t0_value !== (t0_value = ctx.variables.length)) {
				set_data(t0, t0_value);
			}

			if (changed.filterOptions || changed.selected) {
				each_value_1 = ctx.filterOptions;

				for (var i = 0; i < each_value_1.length; i += 1) {
					const child_ctx = get_each_context_1$4(ctx, each_value_1, i);

					if (each_blocks_1[i]) {
						each_blocks_1[i].p(changed, child_ctx);
					} else {
						each_blocks_1[i] = create_each_block_1$4(child_ctx);
						each_blocks_1[i].c();
						each_blocks_1[i].m(div0, null);
					}
				}

				for (; i < each_blocks_1.length; i += 1) {
					each_blocks_1[i].d(1);
				}
				each_blocks_1.length = each_value_1.length;
			}

			if (changed.variables) {
				each_value = ctx.variables;

				for (var i = 0; i < each_value.length; i += 1) {
					const child_ctx = get_each_context$a(ctx, each_value, i);

					if (each_blocks[i]) {
						each_blocks[i].p(changed, child_ctx);
						transition_in(each_blocks[i], 1);
					} else {
						each_blocks[i] = create_each_block$a(child_ctx);
						each_blocks[i].c();
						transition_in(each_blocks[i], 1);
						each_blocks[i].m(div1, null);
					}
				}

				group_outros();
				for (i = each_value.length; i < each_blocks.length; i += 1) out(i);
				check_outros();
			}
		},

		i: function intro(local) {
			if (current) return;
			for (var i = 0; i < each_value.length; i += 1) transition_in(each_blocks[i]);

			if (!div2_intro) {
				add_render_callback(() => {
					div2_intro = create_in_transition(div2, fade, { duration: 300 });
					div2_intro.start();
				});
			}

			current = true;
		},

		o: function outro(local) {
			each_blocks = each_blocks.filter(Boolean);
			for (let i = 0; i < each_blocks.length; i += 1) transition_out(each_blocks[i]);

			current = false;
		},

		d: function destroy(detaching) {
			if (detaching) {
				detach(div2);
			}

			destroy_each(each_blocks_1, detaching);

			destroy_each(each_blocks, detaching);
		}
	};
}

function instance$n($$self, $$props, $$invalidate) {
	let $variableStore;

	validate_store(variableStore, 'variableStore');
	subscribe($$self, variableStore, $$value => { $variableStore = $$value; $$invalidate('$variableStore', $variableStore); });

	

  let { studyId = 0 } = $$props;

  const studyVariables =
    $variableStore.filter(v => v.studyId === studyId) || [];
  let variables = studyVariables;

  const filterOptions = [
    "Demographics",
    "Non-demographics",
    "Nominal",
    "Ordinal",
    "Scale",
    "Qualitative"
  ];
  let selected = filterOptions;

  function filter() {
    let vars = studyVariables.filter(v => {
      let bool = false;
      // 1. check demographic type
      for (const filter of selected) {
        switch (filter) {
          case "Demographics":
            bool |= v.isDemographic === true;
            break;
          case "Non-demographics":
            bool |= v.isDemographic === false;
            break;
        }
      }
      return bool;
    });
    // 2. filter remaining vars on measure
    $$invalidate('variables', variables = vars.filter(v => {
      let bool = false;
      for (const filter of selected) {
        bool |= v.measure === filter.toLowerCase();
      }
      return bool;
    }));
  }

	const writable_props = ['studyId'];
	Object.keys($$props).forEach(key => {
		if (!writable_props.includes(key) && !key.startsWith('$$')) console.warn(`<Descriptives> was created with unknown prop '${key}'`);
	});

	const $$binding_groups = [[]];

	function input_change_handler() {
		selected = get_binding_group_value($$binding_groups[0]);
		$$invalidate('selected', selected);
	}

	$$self.$set = $$props => {
		if ('studyId' in $$props) $$invalidate('studyId', studyId = $$props.studyId);
	};

	return {
		studyId,
		variables,
		filterOptions,
		selected,
		filter,
		input_change_handler,
		$$binding_groups
	};
}

class Descriptives extends SvelteComponentDev {
	constructor(options) {
		super(options);
		init(this, options, instance$n, create_fragment$n, safe_not_equal, ["studyId"]);
	}

	get studyId() {
		throw new Error("<Descriptives>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set studyId(value) {
		throw new Error("<Descriptives>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}
}

/* src\charts\CustomChart.svelte generated by Svelte v3.6.7 */

const file$o = "src\\charts\\CustomChart.svelte";

function create_fragment$o(ctx) {
	var div;

	return {
		c: function create() {
			div = element("div");
			attr(div, "id", ctx.chartId);
			add_location(div, file$o, 155, 0, 4192);
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

function getGraph(variable) {
  const variableName = variable.variableName;
  let data = variable.results.map(v => v.value);

  if (variable.dataformat.textChoices) {
    // map values to labels
    const answerMap = {};
    for (const choice of variable.dataformat.textChoices) {
      answerMap[choice.value] = trunc(choice.valueLabel || choice.text);
    }
    data = data.map(v => answerMap[v]);
  }
  const graphs = [];
  const graph = {
    data: {
      values: data
    },
    description: `Count of ${variableName} results`,
    title: { text: variableName, fontSize: 16 },
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
        axis: { domain: false, titleFontWeight: 300 }
      }
    }
  };
  graphs.push(graph);

  if (variable.measure === "scale") {
    const graph = {
      data: {
        values: data
      },
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
    graphs.push(graph);

    const graphUID = {
      data: {
        values: variable.results
      },
      mark: "bar",
      encoding: {
        y: {
          field: "value",
          aggregate: "mean",
          type: "quantitative",
          //scale: { domain: [Math.min(...data), Math.max(...data)] },
          axis: { title: variableName, domain: false }
        },
        x: {
          field: "uid",
          type: "nominal"
          //scale: { domain: [Math.min(...data), Math.max(...data)] },
        }
      }
    };
    graphs.push(graphUID);

    if (!variable.isDemographic) {
      const graphTime = {
        data: {
          values: variable.results
        },
        mark: {
          type: "line",
          interpolate: "monotone"
        },
        encoding: {
          y: {
            field: "value",
            aggregate: "mean",
            type: "quantitative",
            //scale: { domain: [Math.min(...data), Math.max(...data)] },
            axis: { title: variableName, domain: false }
          },
          x: {
            field: "date",
            type: "temporal",
            timeUnit: "day"
            //scale: { domain: [Math.min(...data), Math.max(...data)] },
          }
        }
      };
      graphs.push(graphTime);
    }
  }

  const spec = {
    vconcat: graphs
  };
  return spec;
}

function instance$o($$self, $$props, $$invalidate) {
	
  //   import Custom2dChart from "./Custom2dChart.svelte";
  let { selectedVariables = [] } = $$props;
  const chartId = `viscustom`;
  let isMounted = false;

  // vega-lite charts
  const vegaOptions = {
    renderer: "svg",
    mode: "vega-lite",
    actions: { export: true, source: false, editor: false, compiled: false },
    downloadFileName: `sensQvis_chart_custom`
  };

  function updateGraphs(selectedVariables) {
    if (!isMounted) return;
    if (!selectedVariables.length) return;
    const graphs = [];
    for (const selectedVar of selectedVariables) {
      graphs.push(getGraph(selectedVar));
    }
    vegaEmbed(`#${chartId}`, { hconcat: graphs }, vegaOptions);
  }
  onMount(() => {
    isMounted = true;
    if (!selectedVariables.length) return;
    let spec = getGraph(selectedVariables[0]);
    if (selectedVariables.length === 2) {
      spec = { hconcat: [spec, getGraph(selectedVariables[1])] };
    }
    vegaEmbed(`#${chartId}`, spec, vegaOptions);
  });

	const writable_props = ['selectedVariables'];
	Object.keys($$props).forEach(key => {
		if (!writable_props.includes(key) && !key.startsWith('$$')) console.warn(`<CustomChart> was created with unknown prop '${key}'`);
	});

	$$self.$set = $$props => {
		if ('selectedVariables' in $$props) $$invalidate('selectedVariables', selectedVariables = $$props.selectedVariables);
	};

	$$self.$$.update = ($$dirty = { selectedVariables: 1 }) => {
		if ($$dirty.selectedVariables) { updateGraphs(selectedVariables); }
	};

	return { selectedVariables, chartId };
}

class CustomChart extends SvelteComponentDev {
	constructor(options) {
		super(options);
		init(this, options, instance$o, create_fragment$o, safe_not_equal, ["selectedVariables"]);
	}

	get selectedVariables() {
		throw new Error("<CustomChart>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set selectedVariables(value) {
		throw new Error("<CustomChart>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}
}

/* src\charts\Custom3dChart.svelte generated by Svelte v3.6.7 */

const file$p = "src\\charts\\Custom3dChart.svelte";

function create_fragment$p(ctx) {
	var div;

	return {
		c: function create() {
			div = element("div");
			attr(div, "id", "3dchart");
			set_style(div, "width", "100%");
			set_style(div, "height", "100%");
			add_location(div, file$p, 114, 0, 61651);
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

function instance$p($$self, $$props, $$invalidate) {
	let { selectedVariables } = $$props;
  let chart;
  const data = JSON.parse(
    `[["Income","Life Expectancy","Population","Country","Year"],[815,34.05,351014,"Australia",1800],[1314,39,645526,"Canada",1800],[985,32,321675013,"China",1800],[864,32.2,345043,"Cuba",1800],[1244,36.5731262,977662,"Finland",1800],[1803,33.96717024,29355111,"France",1800],[1639,38.37,22886919,"Germany",1800],[926,42.84559912,61428,"Iceland",1800],[1052,25.4424,168574895,"India",1800],[1050,36.4,30294378,"Japan",1800],[579,26,4345000,"North Korea",1800],[576,25.8,9395000,"South Korea",1800],[658,34.05,100000,"New Zealand",1800],[1278,37.91620899,868570,"Norway",1800],[1213,35.9,9508747,"Poland",1800],[1430,29.5734572,31088398,"Russia",1800],[1221,35,9773456,"Turkey",1800],[3431,38.6497603,12327466,"United Kingdom",1800],[2128,39.41,6801854,"United States",1800],[834,34.05,342440,"Australia",1810],[1400,39.01496774,727603,"Canada",1810],[985,32,350542958,"China",1810],[970,33.64,470176,"Cuba",1810],[1267,36.9473378,1070625,"Finland",1810],[1839,37.4,30293172,"France",1810],[1759,38.37,23882461,"Germany",1810],[928,43.13915533,61428,"Iceland",1810],[1051,25.4424,171940819,"India",1810],[1064,36.40397538,30645903,"Japan",1810],[573,26,4345000,"North Korea",1810],[570,25.8,9395000,"South Korea",1810],[659,34.05,100000,"New Zealand",1810],[1299,36.47500606,918398,"Norway",1810],[1260,35.9,9960687,"Poland",1810],[1447,29.5734572,31088398,"Russia",1810],[1223,35,9923007,"Turkey",1810],[3575,38.34738144,14106058,"United Kingdom",1810],[2283,39.41,8294928,"United States",1810],[853,34.05,334002,"Australia",1820],[1491,39.02993548,879432,"Canada",1820],[985,32,380055273,"China",1820],[1090,35.04,607664,"Cuba",1820],[1290,37.29122269,1190807,"Finland",1820],[1876,39.21,31549988,"France",1820],[1887,38.37,25507768,"Germany",1820],[929,36.56365268,62498,"Iceland",1820],[1050,25.4424,176225709,"India",1820],[1079,36.40795077,30993147,"Japan",1820],[567,26,4353556,"North Korea",1820],[564,25.8,9408016,"South Korea",1820],[660,34.05,100000,"New Zealand",1820],[1320,46.96239815,995904,"Norway",1820],[1309,35.9,10508375,"Poland",1820],[1464,29.5734572,31861526,"Russia",1820],[1225,35,10118315,"Turkey",1820],[3403,41.31247671,16221883,"United Kingdom",1820],[2242,39.41,10361646,"United States",1820],[1399,34.05,348143,"Australia",1830],[1651,39.04490323,1202146,"Canada",1830],[986,32,402373519,"China",1830],[1224,35.74,772812,"Cuba",1830],[1360,36.29644969,1327905,"Finland",1830],[1799,39.56,33174810,"France",1830],[2024,38.37,28016571,"Germany",1830],[1036,40.5022162,65604,"Iceland",1830],[1052,25.4424,182214537,"India",1830],[1094,36.41192615,31330455,"Japan",1830],[561,26,4377749,"North Korea",1830],[559,25.8,9444785,"South Korea",1830],[661,34.05,91723,"New Zealand",1830],[1403,45.75400094,1115667,"Norway",1830],[1360,35.9,11232857,"Poland",1830],[1562,29.5734572,34134430,"Russia",1830],[1292,35,10398375,"Turkey",1830],[3661,43.01830917,18533999,"United Kingdom",1830],[2552,39.41,13480460,"United States",1830],[2269,34.05,434095,"Australia",1840],[1922,40.19012,1745604,"Canada",1840],[986,32,411213424,"China",1840],[1374,36.48,975565,"Cuba",1840],[1434,41.46900965,1467238,"Finland",1840],[2184,40.37,34854476,"France",1840],[2102,38.37,31016143,"Germany",1840],[1155,31.97,70010,"Iceland",1840],[1053,25.4424,189298397,"India",1840],[1110,36.41590154,31663783,"Japan",1840],[556,26,4410700,"North Korea",1840],[553,25.8,9494784,"South Korea",1840],[662,34.05,82479,"New Zealand",1840],[1604,45.61661054,1252476,"Norway",1840],[1413,35.9,12090161,"Poland",1840],[1666,29.5734572,37420913,"Russia",1840],[1362,35,10731241,"Turkey",1840],[4149,39.92715263,20737251,"United Kingdom",1840],[2792,39.41,17942443,"United States",1840],[3267,34.05,742619,"Australia",1850],[2202,40.985432,2487811,"Canada",1850],[985,32,402711280,"China",1850],[1543,36.26,1181650,"Cuba",1850],[1512,37.35415172,1607810,"Finland",1850],[2146,43.28,36277905,"France",1850],[2182,38.37,33663143,"Germany",1850],[1287,36.61,74711,"Iceland",1850],[1055,25.4424,196657653,"India",1850],[1125,36.41987692,32223184,"Japan",1850],[550,26,4443898,"North Korea",1850],[547,25.8,9558873,"South Korea",1850],[1898,34.05,94934,"New Zealand",1850],[1675,49.53,1401619,"Norway",1850],[1468,35.9,13219914,"Poland",1850],[1778,29.5734572,41023821,"Russia",1850],[1436,35,11074762,"Turkey",1850],[4480,42.8,22623571,"United Kingdom",1850],[3059,39.41,24136293,"United States",1850],[4795,34.05,1256048,"Australia",1860],[2406,41.541504,3231465,"Canada",1860],[1023,28.85,380047548,"China",1860],[1733,36.24,1324000,"Cuba",1860],[1594,38.15099864,1734254,"Finland",1860],[3086,43.33,37461341,"France",1860],[2509,38.37,36383150,"Germany",1860],[1435,19.76,79662,"Iceland",1860],[1056,23,204966302,"India",1860],[1168,36.42385231,33176900,"Japan",1860],[545,26,4542395,"North Korea",1860],[542,25.8,9650608,"South Korea",1860],[3674,34.05,157114,"New Zealand",1860],[2033,50,1580366,"Norway",1860],[1525,35.9,14848599,"Poland",1860],[1896,29.5734572,44966686,"Russia",1860],[1514,35,11428718,"Turkey",1860],[5268,43.01,24783522,"United Kingdom",1860],[3714,39.41,31936643,"United States",1860],[5431,34.05,1724213,"Australia",1870],[2815,42.460624,3817167,"Canada",1870],[1099,31.95714286,363661158,"China",1870],[1946,29.66,1424672,"Cuba",1870],[1897,45.66140699,1847468,"Finland",1870],[3297,36.41,38170355,"France",1870],[2819,38.37,39702235,"Germany",1870],[1599,38.37,84941,"Iceland",1870],[1058,25.4424,213725049,"India",1870],[1213,36.59264,34638021,"Japan",1870],[539,26,4656353,"North Korea",1870],[536,25.8,9741935,"South Korea",1870],[5156,34.05,301045,"New Zealand",1870],[2483,50.86,1746718,"Norway",1870],[1584,35.9,17013787,"Poland",1870],[2023,31.12082604,49288504,"Russia",1870],[1597,35,11871788,"Turkey",1870],[6046,40.95,27651628,"United Kingdom",1870],[4058,39.41,40821569,"United States",1870],[7120,39.34215686,2253007,"Australia",1880],[3021,44.512464,4360348,"Canada",1880],[1015,32,365544192,"China",1880],[2185,36.84,1555081,"Cuba",1880],[1925,39.67,2047577,"Finland",1880],[3555,42.73,39014053,"France",1880],[3057,38.905,43577358,"Germany",1880],[2035,42.32,90546,"Iceland",1880],[1084,25.4424,223020377,"India",1880],[1395,37.03648,36826469,"Japan",1880],[534,26,4798574,"North Korea",1880],[531,25.8,9806394,"South Korea",1880],[6241,38.51282051,505065,"New Zealand",1880],[2827,51.91,1883716,"Norway",1880],[1848,35.9,19669587,"Poland",1880],[2158,30.20106663,53996807,"Russia",1880],[1535,35,12474351,"Turkey",1880],[6553,43.78,30849957,"United Kingdom",1880],[5292,39.41,51256498,"United States",1880],[7418,44.63431373,3088808,"Australia",1890],[3963,45.12972,4908078,"Canada",1890],[918,32,377135349,"China",1890],[2454,39.54,1658274,"Cuba",1890],[2305,44.61,2358344,"Finland",1890],[3639,43.36,40015501,"France",1890],[3733,40.91,48211294,"Germany",1890],[2009,36.58,96517,"Iceland",1890],[1163,24.384,232819584,"India",1890],[1606,37.67568,39878734,"Japan",1890],[528,26,4959044,"North Korea",1890],[526,25.8,9856047,"South Korea",1890],[6265,42.97564103,669985,"New Zealand",1890],[3251,48.6,2003954,"Norway",1890],[2156,37.41086957,22618933,"Poland",1890],[2233,29.93047652,59151534,"Russia",1890],[1838,35,13188522,"Turkey",1890],[7169,44.75,34215580,"United Kingdom",1890],[5646,45.21,63810074,"United States",1890],[6688,49.92647059,3743708,"Australia",1900],[4858,48.288448,5530806,"Canada",1900],[894,32,395184556,"China",1900],[2756,33.11248,1762227,"Cuba",1900],[2789,41.8,2633389,"Finland",1900],[4314,45.08,40628638,"France",1900],[4596,43.915,55293434,"Germany",1900],[2352,46.64,102913,"Iceland",1900],[1194,18.35,243073946,"India",1900],[1840,38.6,44040263,"Japan",1900],[523,26,5124044,"North Korea",1900],[520,25.8,9926633,"South Korea",1900],[7181,47.43846154,815519,"New Zealand",1900],[3643,53.47,2214923,"Norway",1900],[2583,40.4326087,24700965,"Poland",1900],[3087,30.74960789,64836675,"Russia",1900],[1985,35,13946634,"Turkey",1900],[8013,46.32,37995759,"United Kingdom",1900],[6819,48.92818182,77415610,"United States",1900],[8695,55.21862745,4408209,"Australia",1910],[6794,52.123024,7181200,"Canada",1910],[991,32,417830774,"China",1910],[3095,35.21936,2268558,"Cuba",1910],[3192,48.53,2930441,"Finland",1910],[4542,51.37,41294572,"France",1910],[5162,48.40833333,64064129,"Germany",1910],[3012,52.67,109714,"Iceland",1910],[1391,23.18032,253761202,"India",1910],[1998,39.9736,49314848,"Japan",1910],[544,24.097344,5293486,"North Korea",1910],[538,24.097344,10193929,"South Korea",1910],[8896,51.90128205,1044340,"New Zealand",1910],[4332,57.99,2383631,"Norway",1910],[2846,43.45434783,26493422,"Poland",1910],[3487,31.40217766,71044207,"Russia",1910],[2144,35,14746479,"Turkey",1910],[8305,53.99,41804912,"United Kingdom",1910],[8287,51.8,93559186,"United States",1910],[7867,60.51078431,5345428,"Australia",1920],[6430,56.569064,8764205,"Canada",1920],[1012,32,462750597,"China",1920],[4042,37.38208,3067116,"Cuba",1920],[3097,47.55,3140763,"Finland",1920],[4550,51.6,39069937,"France",1920],[4482,53.5,62277173,"Germany",1920],[2514,54.58,117013,"Iceland",1920],[1197,24.71866667,267795301,"India",1920],[2496,42.04432,55545937,"Japan",1920],[779,27.99984,6117873,"North Korea",1920],[756,27.99984,11839704,"South Korea",1920],[9453,56.36410256,1236395,"New Zealand",1920],[5483,58.89,2634635,"Norway",1920],[3276,46.47608696,24166006,"Poland",1920],[1489,20.5,77871987,"Russia",1920],[1525,29,14200404,"Turkey",1920],[8316,56.6,43825720,"United Kingdom",1920],[9181,55.4,108441644,"United States",1920],[7714,64.998,6473803,"Australia",1930],[7976,58.94,10450983,"Canada",1930],[1055,33.26984,481222579,"China",1930],[5027,42.03308,3918827,"Cuba",1930],[4489,54.438,3450505,"Finland",1930],[6835,56.938,41662571,"France",1930],[6791,59.4991686,66439556,"Germany",1930],[4444,60.228,124871,"Iceland",1930],[1244,28.8016,285470839,"India",1930],[2592,46.65403,63863524,"Japan",1930],[829,33.867168,7366694,"North Korea",1930],[784,35.244168,13929869,"South Korea",1930],[8359,60.86092308,1491937,"New Zealand",1930],[7369,64.074,2807922,"Norway",1930],[3591,49.52382609,28169922,"Poland",1930],[3779,36.428,85369549,"Russia",1930],[2323,35.7818,14930772,"Turkey",1930],[8722,60.85,45957969,"United Kingdom",1930],[10139,59.556,125055606,"United States",1930],[10057,66.336,7052012,"Australia",1940],[8871,63.99,11655920,"Canada",1940],[841,33.30311174,509858820,"China",1940],[4631,48.5472,4672303,"Cuba",1940],[5439,46.586,3696232,"Finland",1940],[4821,49.586,40927546,"France",1940],[9711,60.73821096,71244059,"Germany",1940],[5373,65.786,133257,"Iceland",1940],[1081,32.13056,324372335,"India",1940],[3888,49.052,72709185,"Japan",1940],[1418,41.22756,8870433,"North Korea",1940],[1322,43.98156,15684579,"South Korea",1940],[10673,65.35774359,1629869,"New Zealand",1940],[8349,65.818,2971546,"Norway",1940],[3696,44.752,30041062,"Poland",1940],[5632,41.056,93588981,"Russia",1940],[3163,34.5396,17777172,"Turkey",1940],[10935,60.89,48235963,"United Kingdom",1940],[11320,63.192,134354133,"United States",1940],[12073,69.134,8177344,"Australia",1950],[12022,68.25,13736997,"Canada",1950],[535,39.9994,544112923,"China",1950],[8630,59.8384,5919997,"Cuba",1950],[7198,64.144,4008299,"Finland",1950],[7914,66.594,41879607,"France",1950],[7251,67.0215058,69786246,"Germany",1950],[8670,71.004,142656,"Iceland",1950],[908,34.6284,376325205,"India",1950],[2549,59.378,82199470,"Japan",1950],[868,32.2464,10549469,"North Korea",1950],[807,43.3774,19211386,"South Korea",1950],[14391,69.392,1908001,"New Zealand",1950],[11452,71.492,3265278,"Norway",1950],[4670,59.123,24824013,"Poland",1950],[7514,57.084,102798657,"Russia",1950],[3103,42.5164,21238496,"Turkey",1950],[11135,68.58,50616012,"United Kingdom",1950],[15319,67.988,157813040,"United States",1950],[12229,68.8378,8417640,"Australia",1951],[12419,68.519,14099994,"Canada",1951],[582,40.936264,558820362,"China",1951],[9245,60.18618,6051290,"Cuba",1951],[7738,65.5708,4049689,"Finland",1951],[8301,66.3308,42071027,"France",1951],[7884,67.18742266,70111671,"Germany",1951],[8350,71.0438,144928,"Iceland",1951],[908,34.95868,382231042,"India",1951],[2728,61.0706,83794452,"Japan",1951],[729,23.12128,10248496,"North Korea",1951],[753,40.88998,19304737,"South Korea",1951],[13032,69.2654,1947802,"New Zealand",1951],[11986,72.4284,3300422,"Norway",1951],[4801,59.7336,25264029,"Poland",1951],[7424,57.5768,104306354,"Russia",1951],[3701,42.78358,21806355,"Turkey",1951],[11416,68.176,50620538,"United Kingdom",1951],[16198,68.0836,159880756,"United States",1951],[12084,69.2416,8627052,"Australia",1952],[12911,68.718,14481497,"Canada",1952],[631,41.873128,570764965,"China",1952],[9446,60.82796,6180031,"Cuba",1952],[7914,66.4476,4095130,"Finland",1952],[8446,67.6276,42365756,"France",1952],[8561,67.51033952,70421462,"Germany",1952],[8120,72.4836,147681,"Iceland",1952],[912,35.62796,388515758,"India",1952],[3015,63.1132,85174909,"Japan",1952],[784,20.99616,10049026,"North Korea",1952],[809,40.40256,19566860,"South Korea",1952],[13281,69.4988,1992619,"New Zealand",1952],[12316,72.5548,3333895,"Norway",1952],[4832,60.9112,25738253,"Poland",1952],[7775,57.9696,105969442,"Russia",1952],[3963,43.25976,22393931,"Turkey",1952],[11367,69.472,50683596,"United Kingdom",1952],[16508,68.2992,162280405,"United States",1952],[12228,69.8254,8821938,"Australia",1953],[13158,69.097,14882050,"Canada",1953],[692,42.809992,580886559,"China",1953],[8192,61.46974,6304524,"Cuba",1953],[7877,66.5044,4142353,"Finland",1953],[8622,67.5644,42724452,"France",1953],[9252,67.82125638,70720721,"Germany",1953],[9169,72.3034,150779,"Iceland",1953],[947,36.30024,395137696,"India",1953],[3168,63.4558,86378004,"Japan",1953],[1018,27.87104,9957244,"North Korea",1953],[1051,45.41514,19979069,"South Korea",1953],[13388,70.3522,2040015,"New Zealand",1953],[12707,73.0312,3366281,"Norway",1953],[5027,62.0038,26236679,"Poland",1953],[7981,58.7624,107729541,"Russia",1953],[4361,43.77694,22999018,"Turkey",1953],[11751,69.738,50792671,"United Kingdom",1953],[16974,68.6448,164941716,"United States",1953],[12694,69.9792,9014508,"Australia",1954],[12687,69.956,15300472,"Canada",1954],[694,44.663056,589955812,"China",1954],[8492,62.11152,6424173,"Cuba",1954],[8470,67.4612,4189559,"Finland",1954],[9006,68.4412,43118110,"France",1954],[9926,68.12117324,71015688,"Germany",1954],[9821,73.3532,154110,"Iceland",1954],[962,36.97552,402065915,"India",1954],[3280,64.6984,87438747,"Japan",1954],[1080,38.68292,9972437,"North Korea",1954],[1070,48.42772,20520601,"South Korea",1954],[14907,70.4656,2088194,"New Zealand",1954],[13247,73.1076,3398028,"Norway",1954],[5224,63.0134,26750026,"Poland",1954],[8234,60.7552,109537868,"Russia",1954],[3892,44.33512,23619469,"Turkey",1954],[12173,70.104,50938227,"United Kingdom",1954],[16558,69.4304,167800046,"United States",1954],[13082,70.303,9212824,"Australia",1955],[13513,70.015,15733858,"Canada",1955],[706,46.1666,598574241,"China",1955],[8757,62.7523,6539470,"Cuba",1955],[8802,67.258,4235423,"Finland",1955],[9453,68.708,43528065,"France",1955],[10998,68.4080901,71313740,"Germany",1955],[10548,73.293,157584,"Iceland",1955],[963,37.6538,409280196,"India",1955],[3464,65.861,88389994,"Japan",1955],[1146,42.6208,10086993,"North Korea",1955],[1139,49.9673,21168611,"South Korea",1955],[14883,70.599,2136000,"New Zealand",1955],[13438,73.314,3429431,"Norway",1955],[5386,63.939,27269745,"Poland",1955],[8787,63.148,111355224,"Russia",1955],[4156,44.9343,24253200,"Turkey",1955],[12531,70.07,51113711,"United Kingdom",1955],[17409,69.476,170796378,"United States",1955],[13217,70.1868,9420602,"Australia",1956],[14253,70.004,16177451,"Canada",1956],[736,48.536704,607167524,"China",1956],[9424,63.39308,6652086,"Cuba",1956],[8971,67.8748,4279108,"Finland",1956],[9907,68.7448,43946534,"France",1956],[11751,68.70345102,71623569,"Germany",1956],[10575,72.9728,161136,"Iceland",1956],[993,38.33608,416771502,"India",1956],[3646,65.7236,89262489,"Japan",1956],[1208,43.99568,10285936,"North Korea",1956],[1130,50.64688,21897911,"South Korea",1956],[15358,70.8624,2182943,"New Zealand",1956],[14054,73.3604,3460640,"Norway",1956],[5530,64.7816,27787997,"Poland",1956],[9465,64.6408,113152347,"Russia",1956],[4122,45.57448,24898170,"Turkey",1956],[12572,70.336,51315724,"United Kingdom",1956],[17428,69.5516,173877321,"United States",1956],[13191,70.4706,9637408,"Australia",1957],[14177,69.923,16624767,"Canada",1957],[780,48.587368,615992182,"China",1957],[10636,64.03586,6764787,"Cuba",1957],[9302,67.3716,4320250,"Finland",1957],[10442,69.1816,44376073,"France",1957],[12385,68.62532856,71955005,"Germany",1957],[10295,73.4626,164721,"Iceland",1957],[959,39.02236,424541513,"India",1957],[3843,65.5962,90084818,"Japan",1957],[1322,44.87056,10547389,"North Korea",1957],[1226,51.33946,22681233,"South Korea",1957],[15441,70.3858,2229176,"New Zealand",1957],[14379,73.3068,3491657,"Norway",1957],[5730,65.5442,28297669,"Poland",1957],[9496,63.7336,114909562,"Russia",1957],[4943,46.25466,25552398,"Turkey",1957],[12702,70.452,51543847,"United Kingdom",1957],[17430,69.3272,176995108,"United States",1957],[13545,71.0244,9859257,"Australia",1958],[14056,70.582,17067983,"Canada",1958],[889,48.143792,625155626,"China",1958],[10501,64.67964,6881209,"Cuba",1958],[9276,68.5084,4358901,"Finland",1958],[10681,70.4184,44827950,"France",1958],[12884,69.36929231,72318498,"Germany",1958],[10896,73.4224,168318,"Iceland",1958],[1005,39.71364,432601236,"India",1958],[3996,67.2188,90883290,"Japan",1958],[1498,45.33644,10843979,"North Korea",1958],[1233,52.04404,23490027,"South Korea",1958],[15688,71.0192,2275392,"New Zealand",1958],[14285,73.2932,3522361,"Norway",1958],[5923,66.0188,28792427,"Poland",1958],[10037,66.6264,116615781,"Russia",1958],[5252,46.97084,26214022,"Turkey",1958],[12672,70.628,51800117,"United Kingdom",1958],[16961,69.5928,180107612,"United States",1958],[14076,70.5982,10079604,"Australia",1959],[14289,70.621,17498573,"Canada",1959],[958,36.336856,634649557,"China",1959],[9234,65.32842,7005486,"Cuba",1959],[9751,68.6852,4395427,"Finland",1959],[10911,70.4552,45319442,"France",1959],[13759,69.48021979,72724260,"Germany",1959],[10865,72.6522,171919,"Iceland",1959],[1002,40.41292,440968677,"India",1959],[4288,67.6114,91681713,"Japan",1959],[1452,45.93132,11145152,"North Korea",1959],[1212,52.76062,24295786,"South Korea",1959],[16454,70.9326,2322669,"New Zealand",1959],[14797,73.4196,3552545,"Norway",1959],[6009,65.6314,29266789,"Poland",1959],[9755,67.3692,118266807,"Russia",1959],[4869,47.72102,26881379,"Turkey",1959],[13122,70.724,52088147,"United Kingdom",1959],[17909,69.8084,183178348,"United States",1959],[14346,71.042,10292328,"Australia",1960],[14414,71,17909232,"Canada",1960],[889,29.51112,644450173,"China",1960],[9213,65.9852,7141129,"Cuba",1960],[10560,68.882,4430228,"Finland",1960],[11642,70.672,45865699,"France",1960],[14808,69.40190727,73179665,"Germany",1960],[10993,74.082,175520,"Iceland",1960],[1048,41.1222,449661874,"India",1960],[4756,67.904,92500754,"Japan",1960],[1544,46.2922,11424179,"North Korea",1960],[1178,53.4912,25074028,"South Korea",1960],[16179,71.396,2371999,"New Zealand",1960],[15542,73.436,3582016,"Norway",1960],[6248,67.964,29716363,"Poland",1960],[10496,68.382,119860289,"Russia",1960],[4735,48.4992,27553280,"Turkey",1960],[13697,70.94,52410496,"United Kingdom",1960],[18059,69.734,186176524,"United States",1960],[14126,71.3158,10494911,"Australia",1961],[14545,71.229,18295922,"Canada",1961],[558,31.930824,654625069,"China",1961],[9248,66.64998,7289828,"Cuba",1961],[11286,68.9088,4463432,"Finland",1961],[12168,71.2588,46471083,"France",1961],[15317,69.99702797,73686490,"Germany",1961],[10801,73.4618,179106,"Iceland",1961],[1051,41.84348,458691457,"India",1961],[5276,68.5566,93357259,"Japan",1961],[1624,46.54408,11665593,"North Korea",1961],[1201,54.23578,25808542,"South Korea",1961],[16664,71.1194,2423769,"New Zealand",1961],[16425,73.4424,3610710,"Norway",1961],[6669,68.0866,30138099,"Poland",1961],[10908,68.6248,121390327,"Russia",1961],[4691,49.30038,28229291,"Turkey",1961],[13887,70.686,52765864,"United Kingdom",1961],[18170,70.1396,189077076,"United States",1961],[14742,71.0896,10691220,"Australia",1962],[15276,71.258,18659663,"Canada",1962],[567,42.274688,665426760,"China",1962],[9273,67.32476,7450404,"Cuba",1962],[11560,68.6156,4494623,"Finland",1962],[12767,70.7956,47121575,"France",1962],[15872,70.16889372,74238494,"Germany",1962],[11489,73.6716,182640,"Iceland",1962],[1046,42.57776,468054145,"India",1962],[5686,68.8392,94263646,"Japan",1962],[1592,46.82096,11871720,"North Korea",1962],[1182,54.99436,26495107,"South Korea",1962],[16646,71.3828,2477328,"New Zealand",1962],[16793,73.3188,3638791,"Norway",1962],[6511,67.7492,30530513,"Poland",1962],[11027,68.2776,122842753,"Russia",1962],[4849,50.11556,28909985,"Turkey",1962],[13897,70.752,53146634,"United Kingdom",1962],[18966,70.0252,191860710,"United States",1962],[15357,71.1534,10892700,"Australia",1963],[15752,71.267,19007305,"Canada",1963],[635,49.619432,677332765,"China",1963],[9244,68.00654,7618359,"Cuba",1963],[11858,69.0224,4522727,"Finland",1963],[13235,70.6524,47781535,"France",1963],[16221,70.26131586,74820389,"Germany",1963],[12447,72.9714,186056,"Iceland",1963],[1071,43.32404,477729958,"India",1963],[6106,69.9218,95227653,"Japan",1963],[1577,47.22984,12065470,"North Korea",1963],[1305,55.76694,27143075,"South Korea",1963],[17340,71.4562,2530791,"New Zealand",1963],[17347,72.9552,3666690,"Norway",1963],[6836,68.6818,30893775,"Poland",1963],[10620,68.7404,124193114,"Russia",1963],[5188,50.93674,29597047,"Turkey",1963],[14393,70.658,53537821,"United Kingdom",1963],[19497,69.8508,194513911,"United States",1963],[16098,70.8172,11114995,"Australia",1964],[16464,71.646,19349346,"Canada",1964],[713,50.988016,690932043,"China",1964],[9179,68.69332,7787149,"Cuba",1964],[12389,69.2292,4546343,"Finland",1964],[13969,71.6192,48402900,"France",1964],[17100,70.82344196,75410766,"Germany",1964],[13450,73.5612,189276,"Iceland",1964],[1125,44.07932,487690114,"India",1964],[6741,70.3944,96253064,"Japan",1964],[1592,47.82972,12282421,"North Korea",1964],[1380,56.55352,27770874,"South Korea",1964],[17837,71.4996,2581578,"New Zealand",1964],[18118,73.4516,3694987,"Norway",1964],[7078,68.9144,31229448,"Poland",1964],[11836,69.5332,125412397,"Russia",1964],[5296,51.75292,30292969,"Turkey",1964],[15067,71.444,53920055,"United Kingdom",1964],[20338,70.1364,197028908,"United States",1964],[16601,71.151,11368011,"Australia",1965],[17243,71.745,19693538,"Canada",1965],[772,53.26108,706590947,"China",1965],[9116,69.3761,7951928,"Cuba",1965],[13006,68.986,4564690,"Finland",1965],[14514,71.456,48952283,"France",1965],[17838,70.81075623,75990737,"Germany",1965],[14173,73.831,192251,"Iceland",1965],[1053,44.8386,497920270,"India",1965],[7048,70.447,97341852,"Japan",1965],[1630,48.6336,12547524,"North Korea",1965],[1416,57.3651,28392722,"South Korea",1965],[18632,71.433,2628003,"New Zealand",1965],[18980,73.568,3724065,"Norway",1965],[7409,69.617,31539695,"Poland",1965],[12363,69.116,126483874,"Russia",1965],[5309,52.5551,31000167,"Turkey",1965],[15292,71.43,54278349,"United Kingdom",1965],[21361,70.212,199403532,"United States",1965],[16756,70.9948,11657281,"Australia",1966],[18022,71.874,20041006,"Canada",1966],[826,54.364464,724490033,"China",1966],[9436,70.04688,8110428,"Cuba",1966],[13269,69.5028,4577033,"Finland",1966],[15158,71.8728,49411342,"France",1966],[18262,70.92828395,76558016,"Germany",1966],[15166,73.2208,194935,"Iceland",1966],[1037,45.59388,508402908,"India",1966],[7724,71.2596,98494630,"Japan",1966],[1616,49.60048,12864683,"North Korea",1966],[1563,58.21268,29006181,"South Korea",1966],[19467,71.2964,2668590,"New Zealand",1966],[19588,73.8444,3754010,"Norway",1966],[7818,70.0296,31824145,"Poland",1966],[12823,69.1788,127396324,"Russia",1966],[5906,53.33228,31718266,"Turkey",1966],[15494,71.346,54606608,"United Kingdom",1966],[22495,70.2276,201629471,"United States",1966],[17570,71.2786,11975795,"Australia",1967],[18240,72.083,20389445,"Canada",1967],[719,55.889368,744365635,"China",1967],[10372,70.69866,8263547,"Cuba",1967],[13477,69.6796,4584264,"Finland",1967],[15759,71.8696,49791771,"France",1967],[18311,71.15404398,77106876,"Germany",1967],[14734,73.7206,197356,"Iceland",1967],[1096,46.33916,519162069,"India",1967],[8454,71.5522,99711082,"Japan",1967],[1646,50.62536,13221826,"North Korea",1967],[1621,59.09526,29606633,"South Korea",1967],[18309,71.6798,2704205,"New Zealand",1967],[20686,73.9108,3784579,"Norway",1967],[8044,69.7322,32085011,"Poland",1967],[13256,68.9616,128165823,"Russia",1967],[6020,54.08346,32448404,"Turkey",1967],[15777,71.972,54904680,"United Kingdom",1967],[22803,70.5532,203713082,"United States",1967],[18261,70.9124,12305530,"Australia",1968],[18900,72.242,20739031,"Canada",1968],[669,56.860432,765570668,"China",1968],[9626,71.32644,8413329,"Cuba",1968],[13726,69.6364,4589226,"Finland",1968],[16321,71.8664,50126895,"France",1968],[19254,70.80345367,77611000,"Germany",1968],[13752,73.9304,199634,"Iceland",1968],[1095,47.07144,530274729,"India",1968],[9439,71.8748,100988866,"Japan",1968],[1673,51.61924,13608611,"North Korea",1968],[1774,60.00184,30204127,"South Korea",1968],[18082,71.3432,2738283,"New Zealand",1968],[21022,73.7872,3815399,"Norway",1968],[8473,70.3748,32330582,"Poland",1968],[13902,68.9144,128837792,"Russia",1968],[6295,54.80964,33196289,"Turkey",1968],[16357,71.598,55171084,"United Kingdom",1968],[23647,70.2088,205687611,"United States",1968],[18949,71.3262,12621240,"Australia",1969],[19614,72.401,21089228,"Canada",1969],[732,58.367416,787191243,"China",1969],[9377,71.92622,8563191,"Cuba",1969],[15058,69.5132,4595807,"Finland",1969],[17339,71.6032,50466183,"France",1969],[20409,70.65682236,78038271,"Germany",1969],[13983,73.7002,201941,"Iceland",1969],[1141,47.78972,541844848,"India",1969],[10548,72.1074,102323674,"Japan",1969],[1643,52.55012,14009168,"North Korea",1969],[1998,60.91542,30811523,"South Korea",1969],[19745,71.7166,2775684,"New Zealand",1969],[21845,73.4936,3845932,"Norway",1969],[8331,69.8674,32571673,"Poland",1969],[13972,68.3872,129475269,"Russia",1969],[6470,55.51382,33969201,"Turkey",1969],[16616,71.554,55406435,"United Kingdom",1969],[24147,70.4444,207599308,"United States",1969],[19719,71,12904760,"Australia",1970],[19842,72.6,21439200,"Canada",1970],[848,60,808510713,"China",1970],[8918,72.5,8715123,"Cuba",1970],[16245,70.2,4606740,"Finland",1970],[18185,72.5,50843830,"France",1970],[21218,70.9,78366605,"Germany",1970],[14937,73.8,204392,"Iceland",1970],[1170,48.5,553943226,"India",1970],[14203,72.2,103707537,"Japan",1970],[1697,53.4,14410400,"North Korea",1970],[2142,61.8,31437141,"South Korea",1970],[19200,71.5,2819548,"New Zealand",1970],[22186,73.9,3875719,"Norway",1970],[8705,70,32816751,"Poland",1970],[14915,68.5,130126383,"Russia",1970],[6740,56.2,34772031,"Turkey",1970],[16933,71.8,55611401,"United Kingdom",1970],[23908,70.7,209485807,"United States",1970],[20176,71.3,13150591,"Australia",1971],[20688,72.9,21790338,"Canada",1971],[876,60.6,829367784,"China",1971],[9471,73.2,8869961,"Cuba",1971],[16564,70.5,4623389,"Finland",1971],[18891,72.6,51273975,"France",1971],[21695,71,78584779,"Germany",1971],[16687,73.8,207050,"Iceland",1971],[1154,48.9,566605402,"India",1971],[14673,72.8,105142875,"Japan",1971],[1699,54.6,14812363,"North Korea",1971],[2427,62.3,32087884,"South Korea",1971],[19871,71.6,2871810,"New Zealand",1971],[23239,74.1,3904750,"Norway",1971],[9256,70.2,33068997,"Poland",1971],[15170,68.6,130808492,"Russia",1971],[6765,56.9,35608079,"Turkey",1971],[17207,72,55785325,"United Kingdom",1971],[24350,71,211357912,"United States",1971],[20385,71.7,13364238,"Australia",1972],[21532,72.9,22141998,"Canada",1972],[843,61.1,849787991,"China",1972],[9745,73.9,9025299,"Cuba",1972],[17722,70.9,4644847,"Finland",1972],[19570,72.8,51741044,"France",1972],[22497,71.2,78700104,"Germany",1972],[17413,73.9,209868,"Iceland",1972],[1125,49.3,579800632,"India",1972],[15694,73.2,106616535,"Japan",1972],[1730,55.7,15214615,"North Korea",1972],[2760,62.8,32759447,"South Korea",1972],[20349,71.8,2930469,"New Zealand",1972],[24308,74.3,3932945,"Norway",1972],[9854,70.6,33328713,"Poland",1972],[15113,68.7,131517584,"Russia",1972],[7186,57.7,36475356,"Turkey",1972],[17793,72,55927492,"United Kingdom",1972],[25374,71.3,213219515,"United States",1972],[21185,72,13552190,"Australia",1973],[22797,73.1,22488744,"Canada",1973],[894,61.7,869474823,"China",1973],[10439,74.1,9176051,"Cuba",1973],[18804,71.3,4668813,"Finland",1973],[20486,73.1,52214014,"France",1973],[23461,71.5,78732884,"Germany",1973],[18360,74.1,212731,"Iceland",1973],[1151,49.9,593451889,"India",1973],[16731,73.5,108085729,"Japan",1973],[1751,56.8,15603001,"North Korea",1973],[3326,63.3,33435268,"South Korea",1973],[21342,71.8,2989985,"New Zealand",1973],[25278,74.5,3959705,"Norway",1973],[10504,70.9,33597810,"Poland",1973],[16236,68.7,132254362,"Russia",1973],[7442,58.3,37366922,"Turkey",1973],[19043,72,56039166,"United Kingdom",1973],[26567,71.6,215092900,"United States",1973],[21383,72.1,13725400,"Australia",1974],[23405,73.2,22823272,"Canada",1974],[888,62.1,888132761,"China",1974],[10805,74.3,9315371,"Cuba",1974],[19273,71.4,4691818,"Finland",1974],[20997,73.3,52647616,"France",1974],[23662,71.8,78713928,"Germany",1974],[19123,74.3,215465,"Iceland",1974],[1139,50.4,607446519,"India",1974],[16320,73.9,109495053,"Japan",1974],[1782,57.9,15960127,"North Korea",1974],[3673,63.9,34091816,"South Korea",1974],[22131,72,3042573,"New Zealand",1974],[26252,74.7,3984291,"Norway",1974],[11020,71.2,33877397,"Poland",1974],[16594,68.6,133012558,"Russia",1974],[7991,58.9,38272701,"Turkey",1974],[18801,72.3,56122405,"United Kingdom",1974],[26258,72.1,217001865,"United States",1974],[21708,72.5,13892674,"Australia",1975],[23593,73.6,23140609,"Canada",1975],[920,62.6,905580445,"China",1975],[11176,74.6,9438445,"Cuba",1975],[19409,71.6,4711459,"Finland",1975],[20851,73.2,53010727,"France",1975],[23630,71.9,78667327,"Germany",1975],[19023,74.7,217958,"Iceland",1975],[1212,50.9,621703641,"India",1975],[16632,74.4,110804519,"Japan",1975],[1844,58.9,16274740,"North Korea",1975],[4108,64.4,34713078,"South Korea",1975],[21467,72.1,3082883,"New Zealand",1975],[27553,74.8,4006221,"Norway",1975],[11430,70.9,34168112,"Poland",1975],[16530,68.2,133788113,"Russia",1975],[8381,59.5,39185637,"Turkey",1975],[18699,72.6,56179925,"United Kingdom",1975],[25934,72.6,218963561,"United States",1975],[22372,73,14054956,"Australia",1976],[24563,73.9,23439940,"Canada",1976],[891,62.4,921688199,"China",1976],[11334,74.6,9544268,"Cuba",1976],[19268,72,4726803,"Finland",1976],[21661,73.4,53293030,"France",1976],[24904,72.3,78604473,"Germany",1976],[19978,75.2,220162,"Iceland",1976],[1201,51.4,636182810,"India",1976],[17117,74.9,111992858,"Japan",1976],[1851,59.8,16539029,"North Korea",1976],[4614,64.9,35290737,"South Korea",1976],[21749,72.3,3108745,"New Zealand",1976],[29117,75,4025297,"Norway",1976],[11605,70.8,34468877,"Poland",1976],[17192,68,134583945,"Russia",1976],[9142,60,40100696,"Turkey",1976],[19207,72.9,56212943,"United Kingdom",1976],[27041,72.9,220993166,"United States",1976],[22373,73.4,14211657,"Australia",1977],[25095,74.2,23723801,"Canada",1977],[904,63.3,936554514,"China",1977],[11712,74.4,9634677,"Cuba",1977],[19261,72.4,4738949,"Finland",1977],[22270,73.8,53509578,"France",1977],[25678,72.6,78524727,"Germany",1977],[21583,75.6,222142,"Iceland",1977],[1266,52,650907559,"India",1977],[17705,75.3,113067848,"Japan",1977],[1884,60.7,16758826,"North Korea",1977],[4964,65.4,35832213,"South Korea",1977],[20623,72.4,3122551,"New Zealand",1977],[30319,75.2,4041789,"Norway",1977],[11713,70.6,34779313,"Poland",1977],[17487,67.8,135406786,"Russia",1977],[8863,60.9,41020211,"Turkey",1977],[19684,73.1,56224944,"United Kingdom",1977],[27990,73.2,223090871,"United States",1977],[22763,73.8,14368543,"Australia",1978],[25853,74.4,23994948,"Canada",1978],[1016,63.7,950537317,"China",1978],[12312,74.5,9711393,"Cuba",1978],[19608,72.9,4749940,"Finland",1978],[22928,74.1,53685486,"France",1978],[26444,72.7,78426715,"Germany",1978],[22659,76,224019,"Iceland",1978],[1305,52.6,665936435,"India",1978],[18484,75.7,114054587,"Japan",1978],[1809,61.5,16953621,"North Korea",1978],[5373,66,36356187,"South Korea",1978],[20707,72.7,3129098,"New Zealand",1978],[31348,75.3,4056280,"Norway",1978],[12033,70.7,35100942,"Poland",1978],[17818,67.7,136259517,"Russia",1978],[8400,61.4,41953105,"Turkey",1978],[20337,73,56223974,"United Kingdom",1978],[29281,73.5,225239456,"United States",1978],[23697,74.2,14532401,"Australia",1979],[26665,74.7,24257594,"Canada",1979],[1059,64,964155176,"China",1979],[12519,74.6,9777287,"Cuba",1979],[20918,73.3,4762758,"Finland",1979],[23647,74.3,53857610,"France",1979],[27515,72.9,78305017,"Germany",1979],[23523,76.4,225972,"Iceland",1979],[1211,53.1,681358553,"India",1979],[19346,76.1,114993274,"Japan",1979],[2015,62.2,17151321,"North Korea",1979],[5505,66.5,36889651,"South Korea",1979],[21144,73,3135453,"New Zealand",1979],[32737,75.5,4069626,"Norway",1979],[11703,70.7,35435627,"Poland",1979],[17632,67.4,137144808,"Russia",1979],[8160,62,42912350,"Turkey",1979],[20871,73.1,56220089,"United Kingdom",1979],[29951,73.7,227411604,"United States",1979],[23872,74.5,14708323,"Australia",1980],[26678,75,24515788,"Canada",1980],[1073,64.5,977837433,"China",1980],[12284,74.6,9835177,"Cuba",1980],[21965,73.7,4779454,"Finland",1980],[23962,74.5,54053224,"France",1980],[27765,73.1,78159527,"Germany",1980],[24580,76.7,228127,"Iceland",1980],[1270,53.6,697229745,"India",1980],[19741,76.3,115912104,"Japan",1980],[1887,62.9,17372167,"North Korea",1980],[4899,66.9,37451085,"South Korea",1980],[21259,73.2,3146771,"New Zealand",1980],[34346,75.7,4082525,"Norway",1980],[11307,70.6,35782855,"Poland",1980],[17557,67.3,138063062,"Russia",1980],[7828,62.7,43905790,"Turkey",1980],[20417,73.4,56221513,"United Kingdom",1980],[29619,73.8,229588208,"United States",1980],[24308,74.8,14898019,"Australia",1981],[27171,75.4,24768525,"Canada",1981],[1099,64.8,991553829,"China",1981],[13224,74.6,9884219,"Cuba",1981],[22279,74,4800899,"Finland",1981],[24186,74.8,54279038,"France",1981],[27846,73.4,77990369,"Germany",1981],[25312,76.9,230525,"Iceland",1981],[1322,54.2,713561406,"India",1981],[20413,76.7,116821569,"Japan",1981],[2073,63.6,17623335,"North Korea",1981],[5159,67.5,38046253,"South Korea",1981],[22191,73.5,3164965,"New Zealand",1981],[34659,75.8,4095177,"Norway",1981],[10610,71,36145211,"Poland",1981],[17619,67.5,139006739,"Russia",1981],[8518,63.2,44936836,"Turkey",1981],[20149,73.8,56231020,"United Kingdom",1981],[30070,74,231765783,"United States",1981],[23884,75,15101227,"Australia",1982],[26031,75.8,25017501,"Canada",1982],[1175,65.2,1005328574,"China",1982],[13421,74.7,9925618,"Cuba",1982],[22873,74.3,4826135,"Finland",1982],[24753,75,54528408,"France",1982],[27645,73.6,77812348,"Germany",1982],[25455,77.1,233121,"Iceland",1982],[1334,54.6,730303461,"India",1982],[20951,77,117708919,"Japan",1982],[2180,64.2,17899236,"North Korea",1982],[5483,67.9,38665964,"South Korea",1982],[22436,73.7,3188664,"New Zealand",1982],[34704,75.9,4107655,"Norway",1982],[10420,71.2,36517072,"Poland",1982],[17951,67.9,139969243,"Russia",1982],[8323,63.7,45997940,"Turkey",1982],[20607,74.1,56250124,"United Kingdom",1982],[29230,74.4,233953874,"United States",1982],[23584,75.3,15318254,"Australia",1983],[26525,76.1,25272656,"Canada",1983],[1229,65.6,1019698475,"China",1983],[13669,74.6,9966733,"Cuba",1983],[23351,74.5,4853196,"Finland",1983],[25188,75.2,54799049,"France",1983],[28227,74,77657451,"Germany",1983],[24594,77.3,235860,"Iceland",1983],[1412,55.1,747374856,"India",1983],[21446,77.1,118552097,"Japan",1983],[2138,64.8,18191881,"North Korea",1983],[6078,68.4,39295418,"South Korea",1983],[22808,73.9,3215826,"New Zealand",1983],[35932,76,4120386,"Norway",1983],[10835,71.1,36879742,"Poland",1983],[18417,67.7,140951400,"Russia",1983],[8535,64.2,47072603,"Turkey",1983],[21357,74.3,56283959,"United Kingdom",1983],[30185,74.6,236161961,"United States",1983],[24934,75.5,15548591,"Australia",1984],[27781,76.4,25546736,"Canada",1984],[1456,66,1035328572,"China",1984],[14019,74.4,10017061,"Cuba",1984],[23926,74.6,4879222,"Finland",1984],[25497,75.5,55084677,"France",1984],[29135,74.4,77566776,"Germany",1984],[25356,77.4,238647,"Iceland",1984],[1436,55.5,764664278,"India",1984],[22268,77.4,119318921,"Japan",1984],[2205,65.4,18487997,"North Korea",1984],[6612,69,39912900,"South Korea",1984],[23698,74.1,3243078,"New Zealand",1984],[38057,76.1,4133833,"Norway",1984],[11138,70.8,37208529,"Poland",1984],[18527,67.4,141955200,"Russia",1984],[8798,64.8,48138191,"Turkey",1984],[21904,74.6,56337848,"United Kingdom",1984],[32110,74.8,238404223,"United States",1984],[25875,75.7,15791043,"Australia",1985],[29016,76.5,25848173,"Canada",1985],[1557,66.4,1052622410,"China",1985],[14135,74.3,10082990,"Cuba",1985],[24630,74.7,4902219,"Finland",1985],[25917,75.7,55379923,"France",1985],[29851,74.6,77570009,"Germany",1985],[25997,77.6,241411,"Iceland",1985],[1462,55.9,782085127,"India",1985],[23554,77.8,119988663,"Japan",1985],[2121,65.9,18778101,"North Korea",1985],[6970,69.5,40501917,"South Korea",1985],[23750,74.2,3268192,"New Zealand",1985],[40031,76.1,4148355,"Norway",1985],[11159,70.7,37486105,"Poland",1985],[18576,68.2,142975753,"Russia",1985],[9163,65.2,49178079,"Turkey",1985],[22648,74.7,56415196,"United Kingdom",1985],[33065,74.8,240691557,"United States",1985],[26057,76,16047026,"Australia",1986],[29482,76.6,26181342,"Canada",1986],[1604,66.8,1071834975,"China",1986],[14025,74.5,10167998,"Cuba",1986],[25133,74.7,4921293,"Finland",1986],[26453,76,55686610,"France",1986],[30514,74.8,77671877,"Germany",1986],[27379,77.6,244145,"Iceland",1986],[1493,56.3,799607235,"India",1986],[24116,78.1,120551455,"Japan",1986],[2106,66.4,19058988,"North Korea",1986],[7996,70,41059473,"South Korea",1986],[24180,74.2,3290132,"New Zealand",1986],[41450,76.1,4164166,"Norway",1986],[11429,70.9,37703942,"Poland",1986],[19221,69.8,144016095,"Russia",1986],[9556,65.7,50187091,"Turkey",1986],[23516,74.9,56519444,"United Kingdom",1986],[33899,74.9,243032017,"United States",1986],[26969,76.2,16314778,"Australia",1987],[30288,76.8,26541981,"Canada",1987],[1652,67.2,1092646739,"China",1987],[13805,74.6,10269276,"Cuba",1987],[26086,74.7,4937259,"Finland",1987],[26963,76.4,56005443,"France",1987],[30986,75.1,77864381,"Germany",1987],[29335,77.7,246867,"Iceland",1987],[1525,56.6,817232241,"India",1987],[25018,78.4,121021830,"Japan",1987],[2142,66.8,19334550,"North Korea",1987],[9096,70.4,41588374,"South Korea",1987],[24222,74.4,3310408,"New Zealand",1987],[42225,76.1,4181326,"Norway",1987],[11207,71.1,37867481,"Poland",1987],[19355,70.1,145056221,"Russia",1987],[10351,66.1,51168841,"Turkey",1987],[24551,75.1,56649375,"United Kingdom",1987],[34787,75,245425409,"United States",1987],[27757,76.4,16585905,"Australia",1988],[31356,77.1,26919036,"Canada",1988],[1597,67.5,1114162025,"China",1988],[13925,74.6,10379080,"Cuba",1988],[27282,74.8,4951886,"Finland",1988],[28101,76.6,56328053,"France",1988],[31906,75.3,78146938,"Germany",1988],[28780,77.8,249563,"Iceland",1988],[1649,57,834944397,"India",1988],[26724,78.6,121432942,"Japan",1988],[2198,67.2,19610512,"North Korea",1988],[10233,71,42085050,"South Korea",1988],[24060,74.6,3332297,"New Zealand",1988],[42101,76.3,4199817,"Norway",1988],[11418,71.2,37990683,"Poland",1988],[19660,70,146040116,"Russia",1988],[10421,66.5,52126497,"Turkey",1988],[25750,75.3,56797704,"United Kingdom",1988],[35929,75,247865202,"United States",1988],[28556,76.6,16849253,"Australia",1989],[31550,77.2,27296517,"Canada",1989],[1474,67.7,1135128009,"China",1989],[13829,74.7,10486110,"Cuba",1989],[28735,74.8,4967776,"Finland",1989],[28942,76.9,56643349,"France",1989],[32706,75.4,78514790,"Germany",1989],[28629,78,252219,"Iceland",1989],[1723,57.3,852736160,"India",1989],[28077,78.9,121831143,"Japan",1989],[2257,67.6,19895390,"North Korea",1989],[11002,71.5,42546704,"South Korea",1989],[24206,75,3360350,"New Zealand",1989],[42449,76.5,4219532,"Norway",1989],[11212,71.1,38094812,"Poland",1989],[19906,69.8,146895053,"Russia",1989],[10103,66.9,53066569,"Turkey",1989],[26279,75.5,56953861,"United Kingdom",1989],[36830,75.2,250340795,"United States",1989],[28604,77,17096869,"Australia",1990],[31163,77.4,27662440,"Canada",1990],[1516,68,1154605773,"China",1990],[13670,74.7,10582082,"Cuba",1990],[28599,75,4986705,"Finland",1990],[29476,77.1,56943299,"France",1990],[31476,75.4,78958237,"Germany",1990],[28666,78.1,254830,"Iceland",1990],[1777,57.7,870601776,"India",1990],[29550,79.1,122249285,"Japan",1990],[2076,67.9,20194354,"North Korea",1990],[12087,72,42972254,"South Korea",1990],[24021,75.4,3397534,"New Zealand",1990],[43296,76.8,4240375,"Norway",1990],[10088,70.8,38195258,"Poland",1990],[19349,69.6,147568552,"Russia",1990],[10670,67.3,53994605,"Turkey",1990],[26424,75.7,57110117,"United Kingdom",1990],[37062,75.4,252847810,"United States",1990],[28122,77.4,17325818,"Australia",1991],[30090,77.6,28014102,"Canada",1991],[1634,68.3,1172327831,"China",1991],[12113,74.7,10664577,"Cuba",1991],[26761,75.4,5009381,"Finland",1991],[29707,77.3,57226524,"France",1991],[32844,75.6,79483739,"Germany",1991],[28272,78.3,257387,"Iceland",1991],[1760,58,888513869,"India",1991],[30437,79.2,122702527,"Japan",1991],[1973,68.2,20510208,"North Korea",1991],[13130,72.5,43358716,"South Korea",1991],[22636,75.8,3445596,"New Zealand",1991],[44419,77.1,4262367,"Norway",1991],[9347,70.7,38297549,"Poland",1991],[18332,69.4,148040354,"Russia",1991],[10568,67.6,54909508,"Turkey",1991],[26017,76,57264600,"United Kingdom",1991],[36543,75.6,255367160,"United States",1991],[27895,77.7,17538387,"Australia",1992],[29977,77.7,28353843,"Canada",1992],[1845,68.6,1188450231,"China",1992],[10637,74.8,10735775,"Cuba",1992],[25726,75.8,5034898,"Finland",1992],[30033,77.5,57495252,"France",1992],[33221,75.9,80075940,"Germany",1992],[26977,78.5,259895,"Iceland",1992],[1821,58.3,906461358,"India",1992],[30610,79.4,123180357,"Japan",1992],[1745,68.4,20838082,"North Korea",1992],[13744,73,43708170,"South Korea",1992],[22651,76.1,3502765,"New Zealand",1992],[45742,77.3,4285504,"Norway",1992],[9553,71.1,38396826,"Poland",1992],[15661,68,148322473,"Russia",1992],[10920,67.9,55811134,"Turkey",1992],[26062,76.3,57419469,"United Kingdom",1992],[37321,75.8,257908206,"United States",1992],[28732,78,17738428,"Australia",1993],[30424,77.8,28680921,"Canada",1993],[2078,68.9,1202982955,"China",1993],[9001,74.8,10797556,"Cuba",1993],[25414,76.2,5061465,"Finland",1993],[29719,77.7,57749881,"France",1993],[32689,76.2,80675999,"Germany",1993],[27055,78.7,262383,"Iceland",1993],[1871,58.6,924475633,"India",1993],[30587,79.6,123658854,"Japan",1993],[1619,68.6,21166230,"North Korea",1993],[14466,73.5,44031222,"South Korea",1993],[23830,76.5,3564227,"New Zealand",1993],[46765,77.6,4309606,"Norway",1993],[9884,71.7,38485892,"Poland",1993],[14320,65.2,148435811,"Russia",1993],[11569,68.3,56707454,"Turkey",1993],[26688,76.5,57575969,"United Kingdom",1993],[37844,75.7,260527420,"United States",1993],[29580,78.2,17932214,"Australia",1994],[31505,77.9,28995822,"Canada",1994],[2323,69.3,1216067023,"China",1994],[9018,74.8,10853435,"Cuba",1994],[26301,76.5,5086499,"Finland",1994],[30303,77.9,57991973,"France",1994],[33375,76.4,81206786,"Germany",1994],[27789,78.8,264893,"Iceland",1994],[1959,59,942604211,"India",1994],[30746,79.8,124101546,"Japan",1994],[1605,68.8,21478544,"North Korea",1994],[15577,73.8,44342530,"South Korea",1994],[24716,76.7,3623181,"New Zealand",1994],[48850,77.8,4334434,"Norway",1994],[10386,71.8,38553355,"Poland",1994],[12535,63.6,148416292,"Russia",1994],[10857,68.6,57608769,"Turkey",1994],[27691,76.7,57736667,"United Kingdom",1994],[38892,75.8,263301323,"United States",1994],[30359,78.4,18124770,"Australia",1995],[32101,78,29299478,"Canada",1995],[2551,69.6,1227841281,"China",1995],[9195,74.9,10906048,"Cuba",1995],[27303,76.7,5108176,"Finland",1995],[30823,78.1,58224051,"France",1995],[33843,76.6,81612900,"Germany",1995],[27671,78.9,267454,"Iceland",1995],[2069,59.3,960874982,"India",1995],[31224,79.9,124483305,"Japan",1995],[1442,62.4,21763670,"North Korea",1995],[16798,74.2,44652994,"South Korea",1995],[25476,76.9,3674886,"New Zealand",1995],[50616,78,4359788,"Norway",1995],[11093,72,38591860,"Poland",1995],[12013,64.2,148293265,"Russia",1995],[11530,69,58522320,"Turkey",1995],[28317,76.8,57903790,"United Kingdom",1995],[39476,75.9,266275528,"United States",1995],[31145,78.6,18318340,"Australia",1996],[32290,78.3,29590952,"Canada",1996],[2775,69.9,1238234851,"China",1996],[9871,75.2,10955372,"Cuba",1996],[28210,76.9,5126021,"Finland",1996],[31141,78.4,58443318,"France",1996],[34008,76.9,81870772,"Germany",1996],[28839,79.1,270089,"Iceland",1996],[2186,59.6,979290432,"India",1996],[31958,80.3,124794817,"Japan",1996],[1393,62.6,22016510,"North Korea",1996],[17835,74.7,44967346,"South Korea",1996],[25984,77.1,3717239,"New Zealand",1996],[52892,78.1,4385951,"Norway",1996],[11776,72.4,38599825,"Poland",1996],[11597,65.9,148078355,"Russia",1996],[12190,69.4,59451488,"Turkey",1996],[28998,76.9,58079322,"United Kingdom",1996],[40501,76.3,269483224,"United States",1996],[32013,78.9,18512971,"Australia",1997],[33310,78.7,29871092,"Canada",1997],[3000,70.3,1247259143,"China",1997],[10106,75.3,11000431,"Cuba",1997],[29884,77.1,5140755,"Finland",1997],[31756,78.7,58652709,"France",1997],[34578,77.3,81993831,"Germany",1997],[30009,79.3,272798,"Iceland",1997],[2235,60,997817250,"India",1997],[32391,80.6,125048424,"Japan",1997],[1230,62.7,22240826,"North Korea",1997],[18687,75.1,45283939,"South Korea",1997],[26152,77.4,3752102,"New Zealand",1997],[55386,78.2,4412958,"Norway",1997],[12602,72.7,38583109,"Poland",1997],[11779,67.4,147772805,"Russia",1997],[12911,69.8,60394104,"Turkey",1997],[29662,77.2,58263858,"United Kingdom",1997],[41812,76.8,272882865,"United States",1997],[33085,79.1,18709175,"Australia",1998],[34389,78.9,30145148,"Canada",1998],[3205,70.7,1255262566,"China",1998],[10086,75.4,11041893,"Cuba",1998],[31423,77.3,5153229,"Finland",1998],[32764,78.8,58867465,"France",1998],[35254,77.7,82010184,"Germany",1998],[31601,79.5,275568,"Iceland",1998],[2332,60.3,1016402907,"India",1998],[31656,80.6,125266403,"Japan",1998],[1267,62.8,22444986,"North Korea",1998],[17493,75.4,45599569,"South Korea",1998],[26077,77.8,3783516,"New Zealand",1998],[56502,78.3,4440109,"Norway",1998],[13225,73,38550777,"Poland",1998],[11173,67.6,147385440,"Russia",1998],[13008,70.4,61344874,"Turkey",1998],[30614,77.4,58456989,"United Kingdom",1998],[43166,77,276354096,"United States",1998],[34346,79.3,18906936,"Australia",1999],[35810,79.1,30420216,"Canada",1999],[3419,71.1,1262713651,"China",1999],[10674,75.6,11080506,"Cuba",1999],[32743,77.5,5164780,"Finland",1999],[33707,78.9,59107738,"France",1999],[35931,77.9,81965830,"Germany",1999],[32521,79.7,278376,"Iceland",1999],[2496,60.7,1034976626,"India",1999],[31535,80.7,125481050,"Japan",1999],[1377,63,22641747,"North Korea",1999],[19233,75.8,45908307,"South Korea",1999],[27371,78.1,3817489,"New Zealand",1999],[57246,78.5,4466468,"Norway",1999],[13824,73.2,38515359,"Poland",1999],[11925,66.2,146924174,"Russia",1999],[12381,70.3,62295617,"Turkey",1999],[31474,77.6,58657794,"United Kingdom",1999],[44673,77.1,279730801,"United States",1999],[35253,79.7,19107251,"Australia",2000],[37314,79.3,30701903,"Canada",2000],[3678,71.5,1269974572,"China",2000],[11268,75.9,11116787,"Cuba",2000],[34517,77.8,5176482,"Finland",2000],[34774,79.1,59387183,"France",2000],[36953,78.1,81895925,"Germany",2000],[33599,79.9,281214,"Iceland",2000],[2548,61.1,1053481072,"India",2000],[32193,81.1,125714674,"Japan",2000],[1287,63.2,22840218,"North Korea",2000],[20757,76.3,46206271,"South Korea",2000],[27963,78.5,3858234,"New Zealand",2000],[58699,78.7,4491572,"Norway",2000],[14565,73.8,38486305,"Poland",2000],[13173,65.4,146400951,"Russia",2000],[13025,71.5,63240157,"Turkey",2000],[32543,77.8,58867004,"United Kingdom",2000],[45986,77.1,282895741,"United States",2000],[35452,80.1,19308681,"Australia",2001],[37563,79.5,30991344,"Canada",2001],[3955,71.9,1277188787,"China",2001],[11588,76.2,11151472,"Cuba",2001],[35327,78.2,5188446,"Finland",2001],[35197,79.2,59711914,"France",2001],[37517,78.3,81809438,"Germany",2001],[34403,80.2,284037,"Iceland",2001],[2628,61.5,1071888190,"India",2001],[32230,81.4,125974298,"Japan",2001],[1368,63.3,23043441,"North Korea",2001],[21536,76.8,46492324,"South Korea",2001],[28752,78.8,3906911,"New Zealand",2001],[59620,78.9,4514907,"Norway",2001],[14744,74.3,38466543,"Poland",2001],[13902,65.1,145818121,"Russia",2001],[12106,72,64182694,"Turkey",2001],[33282,78,59080221,"United Kingdom",2001],[45978,77.1,285796198,"United States",2001],[36375,80.4,19514385,"Australia",2002],[38270,79.7,31288572,"Canada",2002],[4285,72.4,1284349938,"China",2002],[11715,76.6,11184540,"Cuba",2002],[35834,78.5,5200632,"Finland",2002],[35333,79.4,60075783,"France",2002],[37458,78.5,81699829,"Germany",2002],[34252,80.5,286865,"Iceland",2002],[2684,61.9,1090189358,"India",2002],[32248,81.7,126249509,"Japan",2002],[1375,63.5,23248053,"North Korea",2002],[23008,77.3,46769579,"South Korea",2002],[29637,79,3961695,"New Zealand",2002],[60152,79.2,4537240,"Norway",2002],[14964,74.6,38454823,"Poland",2002],[14629,64.9,145195521,"Russia",2002],[12669,72.5,65125766,"Turkey",2002],[33954,78.2,59301235,"United Kingdom",2002],[46367,77.2,288470847,"United States",2002],[37035,80.7,19735255,"Australia",2003],[38621,79.9,31596593,"Canada",2003],[4685,72.9,1291485488,"China",2003],[12123,76.8,11214837,"Cuba",2003],[36461,78.6,5213800,"Finland",2003],[35371,79.7,60464857,"France",2003],[37167,78.8,81569481,"Germany",2003],[34938,80.8,289824,"Iceland",2003],[2850,62.4,1108369577,"India",2003],[32721,81.8,126523884,"Japan",2003],[1405,69.8,23449173,"North Korea",2003],[23566,77.8,47043251,"South Korea",2003],[30404,79.3,4020195,"New Zealand",2003],[60351,79.5,4560947,"Norway",2003],[15508,74.9,38451227,"Poland",2003],[15768,64.8,144583147,"Russia",2003],[13151,72.9,66060121,"Turkey",2003],[35250,78.5,59548421,"United Kingdom",2003],[47260,77.3,291005482,"United States",2003],[38130,81,19985475,"Australia",2004],[39436,80.1,31918582,"Canada",2004],[5127,73.4,1298573031,"China",2004],[12791,76.9,11240680,"Cuba",2004],[37783,78.6,5228842,"Finland",2004],[36090,80.1,60858654,"France",2004],[37614,79.1,81417791,"Germany",2004],[37482,81.1,293084,"Iceland",2004],[3029,62.8,1126419321,"India",2004],[33483,82,126773081,"Japan",2004],[1410,69.9,23639296,"North Korea",2004],[24628,78.3,47320454,"South Korea",2004],[31098,79.5,4078779,"New Zealand",2004],[62370,79.7,4589241,"Norway",2004],[16314,75,38454520,"Poland",2004],[16967,65,144043914,"Russia",2004],[14187,73.4,66973561,"Turkey",2004],[35910,78.8,59846226,"United Kingdom",2004],[48597,77.6,293530886,"United States",2004],[38840,81.2,20274282,"Australia",2005],[40284,80.3,32256333,"Canada",2005],[5675,73.9,1305600630,"China",2005],[14200,77.1,11261052,"Cuba",2005],[38700,78.8,5246368,"Finland",2005],[36395,80.4,61241700,"France",2005],[37901,79.4,81246801,"Germany",2005],[39108,81.3,296745,"Iceland",2005],[3262,63.2,1144326293,"India",2005],[33916,82.2,126978754,"Japan",2005],[1464,70.1,23813324,"North Korea",2005],[25541,78.8,47605863,"South Korea",2005],[31798,79.8,4134699,"New Zealand",2005],[63573,80.1,4624388,"Norway",2005],[16900,75,38463514,"Poland",2005],[18118,64.8,143622566,"Russia",2005],[15176,73.8,67860617,"Turkey",2005],[36665,79.1,60210012,"United Kingdom",2005],[49762,77.7,296139635,"United States",2005],[39416,81.4,20606228,"Australia",2006],[41012,80.5,32611436,"Canada",2006],[6360,74.4,1312600877,"China",2006],[15901,77.4,11275199,"Cuba",2006],[40115,79,5266600,"Finland",2006],[37001,80.7,61609991,"France",2006],[39352,79.7,81055904,"Germany",2006],[39818,81.5,300887,"Iceland",2006],[3514,63.6,1162088305,"India",2006],[34468,82.3,127136576,"Japan",2006],[1461,70.2,23969897,"North Korea",2006],[26734,79.2,47901643,"South Korea",2006],[32281,80,4187584,"New Zealand",2006],[64573,80.4,4667105,"Norway",2006],[17959,75,38478763,"Poland",2006],[19660,66.1,143338407,"Russia",2006],[16013,74.3,68704721,"Turkey",2006],[37504,79.3,60648850,"United Kingdom",2006],[50599,77.8,298860519,"United States",2006],[40643,81.5,20975949,"Australia",2007],[41432,80.6,32982275,"Canada",2007],[7225,74.9,1319625197,"China",2007],[17055,77.6,11284043,"Cuba",2007],[42016,79.2,5289333,"Finland",2007],[37641,80.9,61966193,"France",2007],[40693,79.8,80854515,"Germany",2007],[42598,81.8,305415,"Iceland",2007],[3806,64,1179685631,"India",2007],[35183,82.5,127250015,"Japan",2007],[1392,70.3,24111945,"North Korea",2007],[28063,79.5,48205062,"South Korea",2007],[32928,80.1,4238021,"New Zealand",2007],[65781,80.6,4716584,"Norway",2007],[19254,75.1,38500356,"Poland",2007],[21374,67.2,143180249,"Russia",2007],[16551,74.7,69515492,"Turkey",2007],[38164,79.4,61151820,"United Kingdom",2007],[51011,78.1,301655953,"United States",2007],[41312,81.5,21370348,"Australia",2008],[41468,80.7,33363256,"Canada",2008],[7880,75.1,1326690636,"China",2008],[17765,77.8,11290239,"Cuba",2008],[42122,79.4,5314170,"Finland",2008],[37505,81,62309529,"France",2008],[41199,80,80665906,"Germany",2008],[42294,82,310033,"Iceland",2008],[3901,64.4,1197070109,"India",2008],[34800,82.6,127317900,"Japan",2008],[1427,70.6,24243829,"North Korea",2008],[28650,79.7,48509842,"South Korea",2008],[32122,80.2,4285380,"New Zealand",2008],[65216,80.7,4771633,"Norway",2008],[19996,75.3,38525752,"Poland",2008],[22506,67.6,143123163,"Russia",2008],[16454,75.1,70344357,"Turkey",2008],[37739,79.5,61689620,"United Kingdom",2008],[50384,78.2,304473143,"United States",2008],[41170,81.6,21770690,"Australia",2009],[39884,80.9,33746559,"Canada",2009],[8565,75.6,1333807063,"China",2009],[18035,77.9,11297442,"Cuba",2009],[38455,79.7,5340485,"Finland",2009],[36215,81,62640901,"France",2009],[38975,80,80519685,"Germany",2009],[39979,82.2,314336,"Iceland",2009],[4177,64.7,1214182182,"India",2009],[32880,82.8,127340884,"Japan",2009],[1407,70.7,24371806,"North Korea",2009],[28716,79.8,48807036,"South Korea",2009],[31723,80.3,4329124,"New Zealand",2009],[63354,80.8,4830371,"Norway",2009],[20507,75.6,38551489,"Poland",2009],[20739,68.3,143126660,"Russia",2009],[15467,75.4,71261307,"Turkey",2009],[35840,79.7,62221164,"United Kingdom",2009],[48558,78.3,307231961,"United States",2009],[41330,81.7,22162863,"Australia",2010],[40773,81.1,34126173,"Canada",2010],[9430,75.9,1340968737,"China",2010],[18477,78,11308133,"Cuba",2010],[39425,80,5367693,"Finland",2010],[36745,81.2,62961136,"France",2010],[40632,80.2,80435307,"Germany",2010],[38809,82.5,318042,"Iceland",2010],[4547,65.1,1230984504,"India",2010],[34404,83,127319802,"Japan",2010],[1393,70.8,24500506,"North Korea",2010],[30440,80,49090041,"South Korea",2010],[31824,80.5,4369027,"New Zealand",2010],[62946,80.9,4891251,"Norway",2010],[21328,76.1,38574682,"Poland",2010],[21664,68.7,143158099,"Russia",2010],[16674,75.7,72310416,"Turkey",2010],[36240,80,62716684,"United Kingdom",2010],[49373,78.5,309876170,"United States",2010],[41706,81.8,22542371,"Australia",2011],[41567,81.3,34499905,"Canada",2011],[10274,76.1,1348174478,"China",2011],[19005,78.1,11323570,"Cuba",2011],[40251,80.3,5395816,"Finland",2011],[37328,81.4,63268405,"France",2011],[42080,80.3,80424665,"Germany",2011],[39619,82.7,321030,"Iceland",2011],[4787,65.5,1247446011,"India",2011],[34316,82.8,127252900,"Japan",2011],[1397,71,24631359,"North Korea",2011],[31327,80.3,49356692,"South Korea",2011],[32283,80.6,4404483,"New Zealand",2011],[62737,81.1,4953945,"Norway",2011],[22333,76.5,38594217,"Poland",2011],[22570,69.4,143211476,"Russia",2011],[17908,76,73517002,"Turkey",2011],[36549,80.4,63164949,"United Kingdom",2011],[49781,78.7,312390368,"United States",2011],[42522,81.8,22911375,"Australia",2012],[41865,81.4,34868151,"Canada",2012],[11017,76.3,1355386952,"China",2012],[19586,78.2,11342631,"Cuba",2012],[39489,80.5,5424644,"Finland",2012],[37227,81.6,63561798,"France",2012],[42959,80.5,80477952,"Germany",2012],[39925,82.8,323407,"Iceland",2012],[4967,65.9,1263589639,"India",2012],[34988,83.2,127139821,"Japan",2012],[1393,71.1,24763353,"North Korea",2012],[31901,80.4,49608451,"South Korea",2012],[32806,80.6,4435883,"New Zealand",2012],[63620,81.3,5018367,"Norway",2012],[22740,76.7,38609486,"Poland",2012],[23299,70.4,143287536,"Russia",2012],[18057,76.2,74849187,"Turkey",2012],[36535,80.8,63573766,"United Kingdom",2012],[50549,78.8,314799465,"United States",2012],[42840,81.8,23270465,"Australia",2013],[42213,81.5,35230612,"Canada",2013],[11805,76.5,1362514260,"China",2013],[20122,78.3,11362505,"Cuba",2013],[38788,80.6,5453061,"Finland",2013],[37309,81.7,63844529,"France",2013],[42887,80.7,80565861,"Germany",2013],[40958,82.8,325392,"Iceland",2013],[5244,66.2,1279498874,"India",2013],[35614,83.3,126984964,"Japan",2013],[1392,71.2,24895705,"North Korea",2013],[32684,80.5,49846756,"South Korea",2013],[33360,80.6,4465276,"New Zealand",2013],[63322,81.4,5083450,"Norway",2013],[23144,76.9,38618698,"Poland",2013],[23561,71.3,143367341,"Russia",2013],[18579,76.3,76223639,"Turkey",2013],[36908,81,63955654,"United Kingdom",2013],[51282,78.9,317135919,"United States",2013],[43219,81.8,23622353,"Australia",2014],[42817,81.6,35587793,"Canada",2014],[12609,76.7,1369435670,"China",2014],[20704,78.4,11379111,"Cuba",2014],[38569,80.7,5479660,"Finland",2014],[37218,81.8,64121249,"France",2014],[43444,80.9,80646262,"Germany",2014],[41237,82.8,327318,"Iceland",2014],[5565,66.5,1295291543,"India",2014],[35635,83.4,126794564,"Japan",2014],[1391,71.3,25026772,"North Korea",2014],[33629,80.6,50074401,"South Korea",2014],[33538,80.6,4495482,"New Zealand",2014],[64020,81.5,5147970,"Norway",2014],[23952,77.1,38619974,"Poland",2014],[23293,72.21,143429435,"Russia",2014],[18884,76.4,77523788,"Turkey",2014],[37614,81.2,64331348,"United Kingdom",2014],[52118,79,319448634,"United States",2014],[44056,81.8,23968973,"Australia",2015],[43294,81.7,35939927,"Canada",2015],[13334,76.9,1376048943,"China",2015],[21291,78.5,11389562,"Cuba",2015],[38923,80.8,5503457,"Finland",2015],[37599,81.9,64395345,"France",2015],[44053,81.1,80688545,"Germany",2015],[42182,82.8,329425,"Iceland",2015],[5903,66.8,1311050527,"India",2015],[36162,83.5,126573481,"Japan",2015],[1390,71.4,25155317,"North Korea",2015],[34644,80.7,50293439,"South Korea",2015],[34186,80.6,4528526,"New Zealand",2015],[64304,81.6,5210967,"Norway",2015],[24787,77.3,38611794,"Poland",2015],[23038,73.13,143456918,"Russia",2015],[19360,76.5,78665830,"Turkey",2015],[38225,81.4,64715810,"United Kingdom",2015],[53354,79.1,321773631,"United States",2015]]`
  );
  onMount(() => {
    chart = echarts.init(document.getElementById("3dchart"));
    const names = selectedVariables.map(v => v.variableLabel);
    const option = {
      grid3D: {},
      xAxis3D: {
        type: "category",
        name: names[0],
        axisLabel: {
          formatter: function(value, idx) {
            return `${~~(idx / 10)}`;
          }
        }
      },
      yAxis3D: {
        name: names[1],
        axisLabel: {
          formatter: function(value, idx) {
            return `${~~idx}`;
          }
        }
      },
      zAxis3D: {
        name: names[2],
        axisLabel: {
          formatter: function(value, idx) {
            return `${~~(value / 10000)}`;
          }
        }
      },
      dataset: {
        dimensions: [
          "Income",
          "Life Expectancy",
          "Population",
          "Country",
          { name: "Year", type: "ordinal" }
        ],
        source: data
      },
      series: [
        {
          type: "scatter3D",
          symbolSize: 2.5,
          encode: {
            x: "Population",
            y: "Life Expectancy",
            z: "Income",
            tooltip: [0, 1, 2, 3, 4]
          }
        }
      ]
    };
    // use configuration item and data specified to show chart
    chart.setOption(option);
    function resizeChart() {
      if (chart !== null && !chart.isDisposed()) {
        chart.resize();
      }
    }
    window.addEventListener("resize", resizeChart);

    return () => {
      // clean up after component unmounts
      chart.dispose();
      chart = null;
      window.removeEventListener("resize", resizeChart);
    };
  });

	const writable_props = ['selectedVariables'];
	Object.keys($$props).forEach(key => {
		if (!writable_props.includes(key) && !key.startsWith('$$')) console.warn(`<Custom3dChart> was created with unknown prop '${key}'`);
	});

	$$self.$set = $$props => {
		if ('selectedVariables' in $$props) $$invalidate('selectedVariables', selectedVariables = $$props.selectedVariables);
	};

	return { selectedVariables };
}

class Custom3dChart extends SvelteComponentDev {
	constructor(options) {
		super(options);
		init(this, options, instance$p, create_fragment$p, safe_not_equal, ["selectedVariables"]);

		const { ctx } = this.$$;
		const props = options.props || {};
		if (ctx.selectedVariables === undefined && !('selectedVariables' in props)) {
			console.warn("<Custom3dChart> was created without expected prop 'selectedVariables'");
		}
	}

	get selectedVariables() {
		throw new Error("<Custom3dChart>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set selectedVariables(value) {
		throw new Error("<Custom3dChart>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}
}

/* src\views\Customview.svelte generated by Svelte v3.6.7 */

const file$q = "src\\views\\Customview.svelte";

function get_each_context$b(ctx, list, i) {
	const child_ctx = Object.create(ctx);
	child_ctx.variable = list[i];
	return child_ctx;
}

function get_each_context_1$5(ctx, list, i) {
	const child_ctx = Object.create(ctx);
	child_ctx.study = list[i];
	return child_ctx;
}

// (102:2) {#if studyId}
function create_if_block$5(ctx) {
	var div0, t0, select, t1, div3, div1, t2, t3, t4, ul, t5, t6, div2, current, dispose;

	var each_value_1 = ctx.$studyStore;

	var each_blocks_1 = [];

	for (var i = 0; i < each_value_1.length; i += 1) {
		each_blocks_1[i] = create_each_block_1$5(get_each_context_1$5(ctx, each_value_1, i));
	}

	var each_value = ctx.variables;

	var each_blocks = [];

	for (var i = 0; i < each_value.length; i += 1) {
		each_blocks[i] = create_each_block$b(get_each_context$b(ctx, each_value, i));
	}

	var if_block0 = (ctx.selectedVariables.length > 1) && create_if_block_3$3(ctx);

	var if_block1 = (ctx.selectedVariables.length) && create_if_block_1$4(ctx);

	return {
		c: function create() {
			div0 = element("div");
			t0 = text("Selected study:\r\n      ");
			select = element("select");

			for (var i = 0; i < each_blocks_1.length; i += 1) {
				each_blocks_1[i].c();
			}

			t1 = space();
			div3 = element("div");
			div1 = element("div");
			t2 = text("Variables of ");
			t3 = text(ctx.studyName);
			t4 = space();
			ul = element("ul");

			for (var i = 0; i < each_blocks.length; i += 1) {
				each_blocks[i].c();
			}

			t5 = space();
			if (if_block0) if_block0.c();
			t6 = space();
			div2 = element("div");
			if (if_block1) if_block1.c();
			if (ctx.studyId === void 0) add_render_callback(() => ctx.select_change_handler.call(select));
			attr(select, "name", "studyselect");
			attr(select, "id", "studyselect");
			add_location(select, file$q, 104, 6, 2572);
			attr(div0, "class", "studyselect svelte-eqya5b");
			add_location(div0, file$q, 102, 4, 2516);
			attr(ul, "class", "varList svelte-eqya5b");
			add_location(ul, file$q, 119, 8, 3018);
			attr(div1, "class", "varselect svelte-eqya5b");
			add_location(div1, file$q, 117, 6, 2951);
			attr(div2, "class", "chart svelte-eqya5b");
			add_location(div2, file$q, 147, 6, 3960);
			attr(div3, "class", "customchart svelte-eqya5b");
			add_location(div3, file$q, 116, 4, 2918);

			dispose = [
				listen(select, "change", ctx.select_change_handler),
				listen(select, "change", ctx.selectStudy)
			];
		},

		m: function mount(target, anchor) {
			insert(target, div0, anchor);
			append(div0, t0);
			append(div0, select);

			for (var i = 0; i < each_blocks_1.length; i += 1) {
				each_blocks_1[i].m(select, null);
			}

			select_option(select, ctx.studyId);

			insert(target, t1, anchor);
			insert(target, div3, anchor);
			append(div3, div1);
			append(div1, t2);
			append(div1, t3);
			append(div1, t4);
			append(div1, ul);

			for (var i = 0; i < each_blocks.length; i += 1) {
				each_blocks[i].m(ul, null);
			}

			append(div1, t5);
			if (if_block0) if_block0.m(div1, null);
			append(div3, t6);
			append(div3, div2);
			if (if_block1) if_block1.m(div2, null);
			current = true;
		},

		p: function update(changed, ctx) {
			if (changed.$studyStore || changed.formatDate) {
				each_value_1 = ctx.$studyStore;

				for (var i = 0; i < each_value_1.length; i += 1) {
					const child_ctx = get_each_context_1$5(ctx, each_value_1, i);

					if (each_blocks_1[i]) {
						each_blocks_1[i].p(changed, child_ctx);
					} else {
						each_blocks_1[i] = create_each_block_1$5(child_ctx);
						each_blocks_1[i].c();
						each_blocks_1[i].m(select, null);
					}
				}

				for (; i < each_blocks_1.length; i += 1) {
					each_blocks_1[i].d(1);
				}
				each_blocks_1.length = each_value_1.length;
			}

			if (changed.studyId) select_option(select, ctx.studyId);

			if (!current || changed.studyName) {
				set_data(t3, ctx.studyName);
			}

			if (changed.variables || changed.selectedVariables) {
				each_value = ctx.variables;

				for (var i = 0; i < each_value.length; i += 1) {
					const child_ctx = get_each_context$b(ctx, each_value, i);

					if (each_blocks[i]) {
						each_blocks[i].p(changed, child_ctx);
					} else {
						each_blocks[i] = create_each_block$b(child_ctx);
						each_blocks[i].c();
						each_blocks[i].m(ul, null);
					}
				}

				for (; i < each_blocks.length; i += 1) {
					each_blocks[i].d(1);
				}
				each_blocks.length = each_value.length;
			}

			if (ctx.selectedVariables.length > 1) {
				if (if_block0) {
					if_block0.p(changed, ctx);
					transition_in(if_block0, 1);
				} else {
					if_block0 = create_if_block_3$3(ctx);
					if_block0.c();
					transition_in(if_block0, 1);
					if_block0.m(div1, null);
				}
			} else if (if_block0) {
				group_outros();
				transition_out(if_block0, 1, 1, () => {
					if_block0 = null;
				});
				check_outros();
			}

			if (ctx.selectedVariables.length) {
				if (if_block1) {
					if_block1.p(changed, ctx);
					transition_in(if_block1, 1);
				} else {
					if_block1 = create_if_block_1$4(ctx);
					if_block1.c();
					transition_in(if_block1, 1);
					if_block1.m(div2, null);
				}
			} else if (if_block1) {
				group_outros();
				transition_out(if_block1, 1, 1, () => {
					if_block1 = null;
				});
				check_outros();
			}
		},

		i: function intro(local) {
			if (current) return;
			transition_in(if_block0);
			transition_in(if_block1);
			current = true;
		},

		o: function outro(local) {
			transition_out(if_block0);
			transition_out(if_block1);
			current = false;
		},

		d: function destroy(detaching) {
			if (detaching) {
				detach(div0);
			}

			destroy_each(each_blocks_1, detaching);

			if (detaching) {
				detach(t1);
				detach(div3);
			}

			destroy_each(each_blocks, detaching);

			if (if_block0) if_block0.d();
			if (if_block1) if_block1.d();
			run_all(dispose);
		}
	};
}

// (110:8) {#each $studyStore as study}
function create_each_block_1$5(ctx) {
	var option, t0_value = ctx.study.studyName, t0, t1, t2_value = formatDate(ctx.study.__created), t2, t3, option_value_value;

	return {
		c: function create() {
			option = element("option");
			t0 = text(t0_value);
			t1 = text(" (imported ");
			t2 = text(t2_value);
			t3 = text(")\r\n          ");
			option.__value = option_value_value = ctx.study._id;
			option.value = option.__value;
			add_location(option, file$q, 110, 10, 2747);
		},

		m: function mount(target, anchor) {
			insert(target, option, anchor);
			append(option, t0);
			append(option, t1);
			append(option, t2);
			append(option, t3);
		},

		p: function update(changed, ctx) {
			if ((changed.$studyStore) && t0_value !== (t0_value = ctx.study.studyName)) {
				set_data(t0, t0_value);
			}

			if ((changed.$studyStore) && t2_value !== (t2_value = formatDate(ctx.study.__created))) {
				set_data(t2, t2_value);
			}

			if ((changed.$studyStore) && option_value_value !== (option_value_value = ctx.study._id)) {
				option.__value = option_value_value;
			}

			option.value = option.__value;
		},

		d: function destroy(detaching) {
			if (detaching) {
				detach(option);
			}
		}
	};
}

// (121:10) {#each variables as variable}
function create_each_block$b(ctx) {
	var li, input, input_id_value, input_value_value, t0, label, t1_value = ctx.variable.variableName, t1, label_for_value, t2, span, t3, t4_value = ctx.variable.measure, t4, t5, t6, dispose;

	return {
		c: function create() {
			li = element("li");
			input = element("input");
			t0 = space();
			label = element("label");
			t1 = text(t1_value);
			t2 = space();
			span = element("span");
			t3 = text("(");
			t4 = text(t4_value);
			t5 = text(")");
			t6 = space();
			ctx.$$binding_groups[0].push(input);
			attr(input, "id", input_id_value = ctx.variable.variableName);
			attr(input, "type", "checkbox");
			input.__value = input_value_value = ctx.variable;
			input.value = input.__value;
			add_location(input, file$q, 122, 14, 3113);
			attr(label, "for", label_for_value = ctx.variable.variableName);
			attr(label, "class", "svelte-eqya5b");
			add_location(label, file$q, 128, 14, 3341);
			add_location(span, file$q, 129, 14, 3423);
			attr(li, "class", "svelte-eqya5b");
			add_location(li, file$q, 121, 12, 3093);

			dispose = [
				listen(input, "change", ctx.input_change_handler),
				listen(input, "change", selectVariable)
			];
		},

		m: function mount(target, anchor) {
			insert(target, li, anchor);
			append(li, input);

			input.checked = ~ctx.selectedVariables.indexOf(input.__value);

			append(li, t0);
			append(li, label);
			append(label, t1);
			append(li, t2);
			append(li, span);
			append(span, t3);
			append(span, t4);
			append(span, t5);
			append(li, t6);
		},

		p: function update(changed, ctx) {
			if (changed.selectedVariables) input.checked = ~ctx.selectedVariables.indexOf(input.__value);

			if ((changed.variables) && input_id_value !== (input_id_value = ctx.variable.variableName)) {
				attr(input, "id", input_id_value);
			}

			if ((changed.variables) && input_value_value !== (input_value_value = ctx.variable)) {
				input.__value = input_value_value;
			}

			input.value = input.__value;

			if ((changed.variables) && t1_value !== (t1_value = ctx.variable.variableName)) {
				set_data(t1, t1_value);
			}

			if ((changed.variables) && label_for_value !== (label_for_value = ctx.variable.variableName)) {
				attr(label, "for", label_for_value);
			}

			if ((changed.variables) && t4_value !== (t4_value = ctx.variable.measure)) {
				set_data(t4, t4_value);
			}
		},

		d: function destroy(detaching) {
			if (detaching) {
				detach(li);
			}

			ctx.$$binding_groups[0].splice(ctx.$$binding_groups[0].indexOf(input), 1);
			run_all(dispose);
		}
	};
}

// (134:8) {#if selectedVariables.length > 1}
function create_if_block_3$3(ctx) {
	var div, div_transition, current, dispose;

	function select_block_type(ctx) {
		if (ctx.combine) return create_if_block_4$2;
		return create_else_block_1$1;
	}

	var current_block_type = select_block_type(ctx);
	var if_block = current_block_type(ctx);

	return {
		c: function create() {
			div = element("div");
			if_block.c();
			attr(div, "class", "combine svelte-eqya5b");
			add_location(div, file$q, 134, 10, 3565);
			dispose = listen(div, "click", ctx.click_handler);
		},

		m: function mount(target, anchor) {
			insert(target, div, anchor);
			if_block.m(div, null);
			current = true;
		},

		p: function update(changed, ctx) {
			if (current_block_type === (current_block_type = select_block_type(ctx)) && if_block) {
				if_block.p(changed, ctx);
			} else {
				if_block.d(1);
				if_block = current_block_type(ctx);
				if (if_block) {
					if_block.c();
					if_block.m(div, null);
				}
			}
		},

		i: function intro(local) {
			if (current) return;
			add_render_callback(() => {
				if (!div_transition) div_transition = create_bidirectional_transition(div, fly, { duration: 200, x: -50 }, true);
				div_transition.run(1);
			});

			current = true;
		},

		o: function outro(local) {
			if (!div_transition) div_transition = create_bidirectional_transition(div, fly, { duration: 200, x: -50 }, false);
			div_transition.run(0);

			current = false;
		},

		d: function destroy(detaching) {
			if (detaching) {
				detach(div);
			}

			if_block.d();

			if (detaching) {
				if (div_transition) div_transition.end();
			}

			dispose();
		}
	};
}

// (141:12) {:else}
function create_else_block_1$1(ctx) {
	var t, if_block_anchor;

	var if_block = (ctx.check3dChartAvailable()) && create_if_block_5$2();

	return {
		c: function create() {
			t = text("Combine in one chart\r\n              ");
			if (if_block) if_block.c();
			if_block_anchor = empty();
		},

		m: function mount(target, anchor) {
			insert(target, t, anchor);
			if (if_block) if_block.m(target, anchor);
			insert(target, if_block_anchor, anchor);
		},

		p: function update(changed, ctx) {
			if (ctx.check3dChartAvailable()) {
				if (!if_block) {
					if_block = create_if_block_5$2();
					if_block.c();
					if_block.m(if_block_anchor.parentNode, if_block_anchor);
				}
			} else if (if_block) {
				if_block.d(1);
				if_block = null;
			}
		},

		d: function destroy(detaching) {
			if (detaching) {
				detach(t);
			}

			if (if_block) if_block.d(detaching);

			if (detaching) {
				detach(if_block_anchor);
			}
		}
	};
}

// (139:12) {#if combine}
function create_if_block_4$2(ctx) {
	var t;

	return {
		c: function create() {
			t = text("Split into separate charts");
		},

		m: function mount(target, anchor) {
			insert(target, t, anchor);
		},

		p: noop,

		d: function destroy(detaching) {
			if (detaching) {
				detach(t);
			}
		}
	};
}

// (143:14) {#if check3dChartAvailable()}
function create_if_block_5$2(ctx) {
	var t;

	return {
		c: function create() {
			t = text("(3D)");
		},

		m: function mount(target, anchor) {
			insert(target, t, anchor);
		},

		d: function destroy(detaching) {
			if (detaching) {
				detach(t);
			}
		}
	};
}

// (149:8) {#if selectedVariables.length}
function create_if_block_1$4(ctx) {
	var current_block_type_index, if_block, if_block_anchor, current;

	var if_block_creators = [
		create_if_block_2$4,
		create_else_block$3
	];

	var if_blocks = [];

	function select_block_type_1(ctx) {
		if (ctx.check3dChartAvailable() && ctx.combine) return 0;
		return 1;
	}

	current_block_type_index = select_block_type_1(ctx);
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
			current_block_type_index = select_block_type_1(ctx);
			if (current_block_type_index === previous_block_index) {
				if_blocks[current_block_type_index].p(changed, ctx);
			} else {
				group_outros();
				transition_out(if_blocks[previous_block_index], 1, 1, () => {
					if_blocks[previous_block_index] = null;
				});
				check_outros();

				if_block = if_blocks[current_block_type_index];
				if (!if_block) {
					if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
					if_block.c();
				}
				transition_in(if_block, 1);
				if_block.m(if_block_anchor.parentNode, if_block_anchor);
			}
		},

		i: function intro(local) {
			if (current) return;
			transition_in(if_block);
			current = true;
		},

		o: function outro(local) {
			transition_out(if_block);
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

// (152:10) {:else}
function create_else_block$3(ctx) {
	var current;

	var customchart = new CustomChart({
		props: { selectedVariables: ctx.selectedVariables },
		$$inline: true
	});

	return {
		c: function create() {
			customchart.$$.fragment.c();
		},

		m: function mount(target, anchor) {
			mount_component(customchart, target, anchor);
			current = true;
		},

		p: function update(changed, ctx) {
			var customchart_changes = {};
			if (changed.selectedVariables) customchart_changes.selectedVariables = ctx.selectedVariables;
			customchart.$set(customchart_changes);
		},

		i: function intro(local) {
			if (current) return;
			transition_in(customchart.$$.fragment, local);

			current = true;
		},

		o: function outro(local) {
			transition_out(customchart.$$.fragment, local);
			current = false;
		},

		d: function destroy(detaching) {
			destroy_component(customchart, detaching);
		}
	};
}

// (150:10) {#if check3dChartAvailable() && combine}
function create_if_block_2$4(ctx) {
	var current;

	var custom3dchart = new Custom3dChart({
		props: { selectedVariables: ctx.selectedVariables },
		$$inline: true
	});

	return {
		c: function create() {
			custom3dchart.$$.fragment.c();
		},

		m: function mount(target, anchor) {
			mount_component(custom3dchart, target, anchor);
			current = true;
		},

		p: function update(changed, ctx) {
			var custom3dchart_changes = {};
			if (changed.selectedVariables) custom3dchart_changes.selectedVariables = ctx.selectedVariables;
			custom3dchart.$set(custom3dchart_changes);
		},

		i: function intro(local) {
			if (current) return;
			transition_in(custom3dchart.$$.fragment, local);

			current = true;
		},

		o: function outro(local) {
			transition_out(custom3dchart.$$.fragment, local);
			current = false;
		},

		d: function destroy(detaching) {
			destroy_component(custom3dchart, detaching);
		}
	};
}

function create_fragment$q(ctx) {
	var div, div_intro, current;

	var if_block = (ctx.studyId) && create_if_block$5(ctx);

	return {
		c: function create() {
			div = element("div");
			if (if_block) if_block.c();
			attr(div, "class", "container svelte-eqya5b");
			add_location(div, file$q, 100, 0, 2442);
		},

		l: function claim(nodes) {
			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
		},

		m: function mount(target, anchor) {
			insert(target, div, anchor);
			if (if_block) if_block.m(div, null);
			current = true;
		},

		p: function update(changed, ctx) {
			if (ctx.studyId) {
				if (if_block) {
					if_block.p(changed, ctx);
					transition_in(if_block, 1);
				} else {
					if_block = create_if_block$5(ctx);
					if_block.c();
					transition_in(if_block, 1);
					if_block.m(div, null);
				}
			} else if (if_block) {
				group_outros();
				transition_out(if_block, 1, 1, () => {
					if_block = null;
				});
				check_outros();
			}
		},

		i: function intro(local) {
			if (current) return;
			transition_in(if_block);

			if (!div_intro) {
				add_render_callback(() => {
					div_intro = create_in_transition(div, fade, { duration: 300 });
					div_intro.start();
				});
			}

			current = true;
		},

		o: function outro(local) {
			transition_out(if_block);
			current = false;
		},

		d: function destroy(detaching) {
			if (detaching) {
				detach(div);
			}

			if (if_block) if_block.d();
		}
	};
}

function selectVariable() {
  // console.log(selectedVariables);
}

function instance$q($$self, $$props, $$invalidate) {
	let $studyStore, $variableStore;

	validate_store(studyStore, 'studyStore');
	subscribe($$self, studyStore, $$value => { $studyStore = $$value; $$invalidate('$studyStore', $studyStore); });
	validate_store(variableStore, 'variableStore');
	subscribe($$self, variableStore, $$value => { $variableStore = $$value; $$invalidate('$variableStore', $variableStore); });

	
  let studyId;
  let combine = false;
  let selectedVariables = [];
  let studyName;
  let variables = [];
  function selectStudy() {
    $$invalidate('variables', variables = $variableStore.filter(v => v.studyId === studyId));
    $$invalidate('selectedVariables', selectedVariables = []);
  }
  function check3dChartAvailable() {
    if (selectedVariables.length < 3) return false;
    const vars = selectedVariables.filter(v => v.measure === "scale");
    return vars.length == 3 && selectedVariables.length == 3;
  }

	const $$binding_groups = [[]];

	function select_change_handler() {
		studyId = select_value(this);
		$$invalidate('studyId', studyId), $$invalidate('$studyStore', $studyStore), $$invalidate('$variableStore', $variableStore);
	}

	function input_change_handler() {
		selectedVariables = get_binding_group_value($$binding_groups[0]);
		$$invalidate('selectedVariables', selectedVariables);
	}

	function click_handler() {
		const $$result = (combine = !combine);
		$$invalidate('combine', combine);
		return $$result;
	}

	$$self.$$.update = ($$dirty = { $studyStore: 1, studyId: 1, $variableStore: 1 }) => {
		if ($$dirty.$studyStore || $$dirty.studyId || $$dirty.$variableStore) { if ($studyStore.length) {
        // default to first study in store
        $$invalidate('studyId', studyId = $studyStore[0]._id);
        $$invalidate('studyName', studyName = $studyStore.filter(v => v._id === studyId)[0].studyName);
    
        $$invalidate('variables', variables = $variableStore.filter(v => v.studyId === studyId));
      } }
	};

	return {
		studyId,
		combine,
		selectedVariables,
		studyName,
		variables,
		selectStudy,
		check3dChartAvailable,
		$studyStore,
		select_change_handler,
		input_change_handler,
		click_handler,
		$$binding_groups
	};
}

class Customview extends SvelteComponentDev {
	constructor(options) {
		super(options);
		init(this, options, instance$q, create_fragment$q, safe_not_equal, []);
	}
}

/* src\components\TabContent.svelte generated by Svelte v3.6.7 */

function get_each_context$c(ctx, list, i) {
	const child_ctx = Object.create(ctx);
	child_ctx.tab = list[i];
	child_ctx.idx = i;
	return child_ctx;
}

// (12:0) {:else}
function create_else_block$4(ctx) {
	var each_1_anchor, current;

	var each_value = ctx.$tabStore;

	var each_blocks = [];

	for (var i = 0; i < each_value.length; i += 1) {
		each_blocks[i] = create_each_block$c(get_each_context$c(ctx, each_value, i));
	}

	const out = i => transition_out(each_blocks[i], 1, 1, () => {
		each_blocks[i] = null;
	});

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

		p: function update(changed, ctx) {
			if (changed.$activeTabIdx || changed.$tabStore) {
				each_value = ctx.$tabStore;

				for (var i = 0; i < each_value.length; i += 1) {
					const child_ctx = get_each_context$c(ctx, each_value, i);

					if (each_blocks[i]) {
						each_blocks[i].p(changed, child_ctx);
						transition_in(each_blocks[i], 1);
					} else {
						each_blocks[i] = create_each_block$c(child_ctx);
						each_blocks[i].c();
						transition_in(each_blocks[i], 1);
						each_blocks[i].m(each_1_anchor.parentNode, each_1_anchor);
					}
				}

				group_outros();
				for (i = each_value.length; i < each_blocks.length; i += 1) out(i);
				check_outros();
			}
		},

		i: function intro(local) {
			if (current) return;
			for (var i = 0; i < each_value.length; i += 1) transition_in(each_blocks[i]);

			current = true;
		},

		o: function outro(local) {
			each_blocks = each_blocks.filter(Boolean);
			for (let i = 0; i < each_blocks.length; i += 1) transition_out(each_blocks[i]);

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

// (10:0) {#if $activeTabIdx === 0}
function create_if_block$6(ctx) {
	var current;

	var studylist = new StudyList({ $$inline: true });

	return {
		c: function create() {
			studylist.$$.fragment.c();
		},

		m: function mount(target, anchor) {
			mount_component(studylist, target, anchor);
			current = true;
		},

		p: noop,

		i: function intro(local) {
			if (current) return;
			transition_in(studylist.$$.fragment, local);

			current = true;
		},

		o: function outro(local) {
			transition_out(studylist.$$.fragment, local);
			current = false;
		},

		d: function destroy(detaching) {
			destroy_component(studylist, detaching);
		}
	};
}

// (14:4) {#if idx === $activeTabIdx}
function create_if_block_1$5(ctx) {
	var current_block_type_index, if_block, if_block_anchor, current;

	var if_block_creators = [
		create_if_block_2$5,
		create_if_block_3$4,
		create_if_block_4$3,
		create_if_block_5$3
	];

	var if_blocks = [];

	function select_block_type_1(ctx) {
		if (ctx.tab.type === 'overview') return 0;
		if (ctx.tab.type === 'userview') return 1;
		if (ctx.tab.type === 'descriptives') return 2;
		if (ctx.tab.type === 'customview') return 3;
		return -1;
	}

	if (~(current_block_type_index = select_block_type_1(ctx))) {
		if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
	}

	return {
		c: function create() {
			if (if_block) if_block.c();
			if_block_anchor = empty();
		},

		m: function mount(target, anchor) {
			if (~current_block_type_index) if_blocks[current_block_type_index].m(target, anchor);
			insert(target, if_block_anchor, anchor);
			current = true;
		},

		p: function update(changed, ctx) {
			var previous_block_index = current_block_type_index;
			current_block_type_index = select_block_type_1(ctx);
			if (current_block_type_index === previous_block_index) {
				if (~current_block_type_index) if_blocks[current_block_type_index].p(changed, ctx);
			} else {
				if (if_block) {
					group_outros();
					transition_out(if_blocks[previous_block_index], 1, 1, () => {
						if_blocks[previous_block_index] = null;
					});
					check_outros();
				}

				if (~current_block_type_index) {
					if_block = if_blocks[current_block_type_index];
					if (!if_block) {
						if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
						if_block.c();
					}
					transition_in(if_block, 1);
					if_block.m(if_block_anchor.parentNode, if_block_anchor);
				} else {
					if_block = null;
				}
			}
		},

		i: function intro(local) {
			if (current) return;
			transition_in(if_block);
			current = true;
		},

		o: function outro(local) {
			transition_out(if_block);
			current = false;
		},

		d: function destroy(detaching) {
			if (~current_block_type_index) if_blocks[current_block_type_index].d(detaching);

			if (detaching) {
				detach(if_block_anchor);
			}
		}
	};
}

// (21:42) 
function create_if_block_5$3(ctx) {
	var current;

	var customview = new Customview({ $$inline: true });

	return {
		c: function create() {
			customview.$$.fragment.c();
		},

		m: function mount(target, anchor) {
			mount_component(customview, target, anchor);
			current = true;
		},

		p: noop,

		i: function intro(local) {
			if (current) return;
			transition_in(customview.$$.fragment, local);

			current = true;
		},

		o: function outro(local) {
			transition_out(customview.$$.fragment, local);
			current = false;
		},

		d: function destroy(detaching) {
			destroy_component(customview, detaching);
		}
	};
}

// (19:44) 
function create_if_block_4$3(ctx) {
	var current;

	var descriptives = new Descriptives({
		props: { studyId: ctx.tab.studyId },
		$$inline: true
	});

	return {
		c: function create() {
			descriptives.$$.fragment.c();
		},

		m: function mount(target, anchor) {
			mount_component(descriptives, target, anchor);
			current = true;
		},

		p: function update(changed, ctx) {
			var descriptives_changes = {};
			if (changed.$tabStore) descriptives_changes.studyId = ctx.tab.studyId;
			descriptives.$set(descriptives_changes);
		},

		i: function intro(local) {
			if (current) return;
			transition_in(descriptives.$$.fragment, local);

			current = true;
		},

		o: function outro(local) {
			transition_out(descriptives.$$.fragment, local);
			current = false;
		},

		d: function destroy(detaching) {
			destroy_component(descriptives, detaching);
		}
	};
}

// (17:40) 
function create_if_block_3$4(ctx) {
	var current;

	var userview = new Userview({
		props: { studyId: ctx.tab.studyId },
		$$inline: true
	});

	return {
		c: function create() {
			userview.$$.fragment.c();
		},

		m: function mount(target, anchor) {
			mount_component(userview, target, anchor);
			current = true;
		},

		p: function update(changed, ctx) {
			var userview_changes = {};
			if (changed.$tabStore) userview_changes.studyId = ctx.tab.studyId;
			userview.$set(userview_changes);
		},

		i: function intro(local) {
			if (current) return;
			transition_in(userview.$$.fragment, local);

			current = true;
		},

		o: function outro(local) {
			transition_out(userview.$$.fragment, local);
			current = false;
		},

		d: function destroy(detaching) {
			destroy_component(userview, detaching);
		}
	};
}

// (15:6) {#if tab.type === 'overview'}
function create_if_block_2$5(ctx) {
	var current;

	var overview = new Overview({
		props: { studyId: ctx.tab.studyId },
		$$inline: true
	});

	return {
		c: function create() {
			overview.$$.fragment.c();
		},

		m: function mount(target, anchor) {
			mount_component(overview, target, anchor);
			current = true;
		},

		p: function update(changed, ctx) {
			var overview_changes = {};
			if (changed.$tabStore) overview_changes.studyId = ctx.tab.studyId;
			overview.$set(overview_changes);
		},

		i: function intro(local) {
			if (current) return;
			transition_in(overview.$$.fragment, local);

			current = true;
		},

		o: function outro(local) {
			transition_out(overview.$$.fragment, local);
			current = false;
		},

		d: function destroy(detaching) {
			destroy_component(overview, detaching);
		}
	};
}

// (13:2) {#each $tabStore as tab, idx}
function create_each_block$c(ctx) {
	var if_block_anchor, current;

	var if_block = (ctx.idx === ctx.$activeTabIdx) && create_if_block_1$5(ctx);

	return {
		c: function create() {
			if (if_block) if_block.c();
			if_block_anchor = empty();
		},

		m: function mount(target, anchor) {
			if (if_block) if_block.m(target, anchor);
			insert(target, if_block_anchor, anchor);
			current = true;
		},

		p: function update(changed, ctx) {
			if (ctx.idx === ctx.$activeTabIdx) {
				if (if_block) {
					if_block.p(changed, ctx);
					transition_in(if_block, 1);
				} else {
					if_block = create_if_block_1$5(ctx);
					if_block.c();
					transition_in(if_block, 1);
					if_block.m(if_block_anchor.parentNode, if_block_anchor);
				}
			} else if (if_block) {
				group_outros();
				transition_out(if_block, 1, 1, () => {
					if_block = null;
				});
				check_outros();
			}
		},

		i: function intro(local) {
			if (current) return;
			transition_in(if_block);
			current = true;
		},

		o: function outro(local) {
			transition_out(if_block);
			current = false;
		},

		d: function destroy(detaching) {
			if (if_block) if_block.d(detaching);

			if (detaching) {
				detach(if_block_anchor);
			}
		}
	};
}

function create_fragment$r(ctx) {
	var current_block_type_index, if_block, if_block_anchor, current;

	var if_block_creators = [
		create_if_block$6,
		create_else_block$4
	];

	var if_blocks = [];

	function select_block_type(ctx) {
		if (ctx.$activeTabIdx === 0) return 0;
		return 1;
	}

	current_block_type_index = select_block_type(ctx);
	if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);

	return {
		c: function create() {
			if_block.c();
			if_block_anchor = empty();
		},

		l: function claim(nodes) {
			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
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
				transition_out(if_blocks[previous_block_index], 1, 1, () => {
					if_blocks[previous_block_index] = null;
				});
				check_outros();

				if_block = if_blocks[current_block_type_index];
				if (!if_block) {
					if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
					if_block.c();
				}
				transition_in(if_block, 1);
				if_block.m(if_block_anchor.parentNode, if_block_anchor);
			}
		},

		i: function intro(local) {
			if (current) return;
			transition_in(if_block);
			current = true;
		},

		o: function outro(local) {
			transition_out(if_block);
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

function instance$r($$self, $$props, $$invalidate) {
	let $activeTabIdx, $tabStore;

	validate_store(activeTabIdx, 'activeTabIdx');
	subscribe($$self, activeTabIdx, $$value => { $activeTabIdx = $$value; $$invalidate('$activeTabIdx', $activeTabIdx); });
	validate_store(tabStore, 'tabStore');
	subscribe($$self, tabStore, $$value => { $tabStore = $$value; $$invalidate('$tabStore', $tabStore); });

	return { $activeTabIdx, $tabStore };
}

class TabContent extends SvelteComponentDev {
	constructor(options) {
		super(options);
		init(this, options, instance$r, create_fragment$r, safe_not_equal, []);
	}
}

/* src\components\StudyInfo.svelte generated by Svelte v3.6.7 */

const file$r = "src\\components\\StudyInfo.svelte";

// (68:0) {:else}
function create_else_block$5(ctx) {
	var div;

	return {
		c: function create() {
			div = element("div");
			div.textContent = "SensQVis";
			attr(div, "class", "appTitle svelte-1nesa59");
			add_location(div, file$r, 68, 2, 1816);
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

// (59:0) {#if currentStudyId}
function create_if_block$7(ctx) {
	var div4, div0, t0, t1, t2, div1, t3, t4_value = formatDate(ctx.startDate, false), t4, t5, t6_value = formatDate(ctx.endDate, false), t6, t7, div2, t8, t9, t10, div3, t11, t12;

	return {
		c: function create() {
			div4 = element("div");
			div0 = element("div");
			t0 = text("Study name: ");
			t1 = text(ctx.name);
			t2 = space();
			div1 = element("div");
			t3 = text("Duration: ");
			t4 = text(t4_value);
			t5 = text(" - ");
			t6 = text(t6_value);
			t7 = space();
			div2 = element("div");
			t8 = text("Number of participants: ");
			t9 = text(ctx.participants);
			t10 = space();
			div3 = element("div");
			t11 = text("Datasets collected: ");
			t12 = text(ctx.datasets);
			attr(div0, "class", "name svelte-1nesa59");
			add_location(div0, file$r, 60, 4, 1547);
			add_location(div1, file$r, 61, 4, 1595);
			add_location(div2, file$r, 64, 4, 1697);
			add_location(div3, file$r, 65, 4, 1752);
			attr(div4, "id", "info");
			attr(div4, "class", "svelte-1nesa59");
			add_location(div4, file$r, 59, 2, 1526);
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
			append(div1, t5);
			append(div1, t6);
			append(div4, t7);
			append(div4, div2);
			append(div2, t8);
			append(div2, t9);
			append(div4, t10);
			append(div4, div3);
			append(div3, t11);
			append(div3, t12);
		},

		p: function update(changed, ctx) {
			if (changed.name) {
				set_data(t1, ctx.name);
			}

			if ((changed.startDate) && t4_value !== (t4_value = formatDate(ctx.startDate, false))) {
				set_data(t4, t4_value);
			}

			if ((changed.endDate) && t6_value !== (t6_value = formatDate(ctx.endDate, false))) {
				set_data(t6, t6_value);
			}

			if (changed.participants) {
				set_data(t9, ctx.participants);
			}

			if (changed.datasets) {
				set_data(t12, ctx.datasets);
			}
		},

		d: function destroy(detaching) {
			if (detaching) {
				detach(div4);
			}
		}
	};
}

function create_fragment$s(ctx) {
	var if_block_anchor;

	function select_block_type(ctx) {
		if (ctx.currentStudyId) return create_if_block$7;
		return create_else_block$5;
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

function instance$s($$self, $$props, $$invalidate) {
	let $tabStore, $studyStore, $responseStore, $userStore;

	validate_store(tabStore, 'tabStore');
	subscribe($$self, tabStore, $$value => { $tabStore = $$value; $$invalidate('$tabStore', $tabStore); });
	validate_store(studyStore, 'studyStore');
	subscribe($$self, studyStore, $$value => { $studyStore = $$value; $$invalidate('$studyStore', $studyStore); });
	validate_store(responseStore, 'responseStore');
	subscribe($$self, responseStore, $$value => { $responseStore = $$value; $$invalidate('$responseStore', $responseStore); });
	validate_store(userStore, 'userStore');
	subscribe($$self, userStore, $$value => { $userStore = $$value; $$invalidate('$userStore', $userStore); });

	

  let name = "Test Study";
  let participants = 27;
  let datasets = 1326;
  let endDate;
  let startDate;
  let currentStudyId;

  activeTabIdx.subscribe(idx => {
    $$invalidate('currentStudyId', currentStudyId = $tabStore[idx].studyId);
    if (currentStudyId) {
      const currentStudy = $studyStore.filter(v => v._id === currentStudyId)[0];
      $$invalidate('name', name = currentStudy.studyName);
      //calc last day of study
      let days =
        Math.max(
          currentStudy.minimumStudyDurationPerPerson,
          currentStudy.maximumStudyDurationPerPerson
        ) || 0;
      $$invalidate('endDate', endDate = new Date(currentStudy.latestBeginOfDataGathering));
      endDate.setDate(endDate.getDate() + days);
      $$invalidate('startDate', startDate = currentStudy.earliestBeginOfDataGathering);
      $$invalidate('datasets', datasets = $responseStore.filter(v => v.studyId == currentStudyId).length);
      $$invalidate('participants', participants = $userStore.filter(v => v.studyId == currentStudyId).length);
    }
  });

	return {
		name,
		participants,
		datasets,
		endDate,
		startDate,
		currentStudyId
	};
}

class StudyInfo extends SvelteComponentDev {
	constructor(options) {
		super(options);
		init(this, options, instance$s, create_fragment$s, safe_not_equal, []);
	}
}

/* src\components\UndoRedo.svelte generated by Svelte v3.6.7 */

const file$s = "src\\components\\UndoRedo.svelte";

function create_fragment$t(ctx) {
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
			attr(path0, "fill", "#bbb");
			attr(path0, "d", "M12.5,8C9.85,8 7.45,9 5.6,10.6L2,7V16H11L7.38,12.38C8.77,11.22\r\n      10.54,10.5 12.5,10.5C16.04,10.5 19.05,12.81\r\n      20.1,16L22.47,15.22C21.08,11.03 17.15,8 12.5,8Z");
			add_location(path0, file$s, 36, 4, 638);
			attr(svg0, "id", "undo");
			set_style(svg0, "width", "1rem");
			set_style(svg0, "height", "1rem");
			attr(svg0, "viewBox", "0 0 24 24");
			attr(svg0, "class", "svelte-lqifqg");
			add_location(svg0, file$s, 35, 2, 566);
			attr(label0, "id", "undoLabel");
			attr(label0, "class", "svelte-lqifqg");
			add_location(label0, file$s, 42, 2, 859);
			attr(path1, "fill", "#bbb");
			attr(path1, "d", "M18.4,10.6C16.55,9 14.15,8 11.5,8C6.85,8 2.92,11.03\r\n      1.54,15.22L3.9,16C4.95,12.81 7.95,10.5 11.5,10.5C13.45,10.5 15.23,11.22\r\n      16.62,12.38L13,16H22V7L18.4,10.6Z");
			add_location(path1, file$s, 44, 4, 969);
			attr(svg1, "id", "redo");
			set_style(svg1, "width", "1rem");
			set_style(svg1, "height", "1rem");
			attr(svg1, "viewBox", "0 0 24 24");
			attr(svg1, "class", "svelte-lqifqg");
			add_location(svg1, file$s, 43, 2, 897);
			attr(label1, "id", "redoLabel");
			attr(label1, "class", "svelte-lqifqg");
			add_location(label1, file$s, 50, 2, 1193);
			attr(div, "class", "svelte-lqifqg");
			add_location(div, file$s, 34, 0, 557);
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
		init(this, options, null, create_fragment$t, safe_not_equal, []);
	}
}

/* src\SensQVis.svelte generated by Svelte v3.6.7 */

const file$t = "src\\SensQVis.svelte";

function create_fragment$u(ctx) {
	var main, header, t0, nav, div0, t1, div1, t2, section, current;

	var studyinfo = new StudyInfo({ $$inline: true });

	var tabnavigation = new TabNavigation({ $$inline: true });

	var undoredo = new UndoRedo({ $$inline: true });

	var tabcontent = new TabContent({ $$inline: true });

	return {
		c: function create() {
			main = element("main");
			header = element("header");
			studyinfo.$$.fragment.c();
			t0 = space();
			nav = element("nav");
			div0 = element("div");
			tabnavigation.$$.fragment.c();
			t1 = space();
			div1 = element("div");
			undoredo.$$.fragment.c();
			t2 = space();
			section = element("section");
			tabcontent.$$.fragment.c();
			attr(header, "class", "svelte-qfuzku");
			add_location(header, file$t, 65, 2, 1401);
			attr(div0, "class", "tabs svelte-qfuzku");
			add_location(div0, file$t, 69, 4, 1456);
			attr(div1, "class", "undoRedo svelte-qfuzku");
			add_location(div1, file$t, 72, 4, 1517);
			attr(nav, "class", "svelte-qfuzku");
			add_location(nav, file$t, 68, 2, 1445);
			attr(section, "class", "svelte-qfuzku");
			add_location(section, file$t, 76, 2, 1585);
			attr(main, "class", "svelte-qfuzku");
			add_location(main, file$t, 64, 0, 1391);
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
			mount_component(tabnavigation, div0, null);
			append(nav, t1);
			append(nav, div1);
			mount_component(undoredo, div1, null);
			append(main, t2);
			append(main, section);
			mount_component(tabcontent, section, null);
			current = true;
		},

		p: noop,

		i: function intro(local) {
			if (current) return;
			transition_in(studyinfo.$$.fragment, local);

			transition_in(tabnavigation.$$.fragment, local);

			transition_in(undoredo.$$.fragment, local);

			transition_in(tabcontent.$$.fragment, local);

			current = true;
		},

		o: function outro(local) {
			transition_out(studyinfo.$$.fragment, local);
			transition_out(tabnavigation.$$.fragment, local);
			transition_out(undoredo.$$.fragment, local);
			transition_out(tabcontent.$$.fragment, local);
			current = false;
		},

		d: function destroy(detaching) {
			if (detaching) {
				detach(main);
			}

			destroy_component(studyinfo, );

			destroy_component(tabnavigation, );

			destroy_component(undoredo, );

			destroy_component(tabcontent, );
		}
	};
}

class SensQVis extends SvelteComponentDev {
	constructor(options) {
		super(options);
		init(this, options, null, create_fragment$u, safe_not_equal, []);
	}
}

const app = new SensQVis({
	target: document.body,
});

export default app;
//# sourceMappingURL=bundle.js.map
