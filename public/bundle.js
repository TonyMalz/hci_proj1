
(function(l, i, v, e) { v = l.createElement(i); v.async = 1; v.src = '//' + (location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; e = l.getElementsByTagName(i)[0]; e.parentNode.insertBefore(v, e)})(document, 'script');
var app = (function () {
    'use strict';

    function noop() { }
    const identity = x => x;
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

    /* src\Tab.svelte generated by Svelte v3.5.1 */

    const file = "src\\Tab.svelte";

    // (28:0) {:else}
    function create_else_block(ctx) {
    	var div, t, dispose;

    	return {
    		c: function create() {
    			div = element("div");
    			t = text(ctx.title);
    			div.className = "svelte-1av4as1";
    			add_location(div, file, 28, 2, 538);
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
    			add_location(input, file, 26, 2, 458);

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
        console.log("blur");
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

    function fade(node, { delay = 0, duration = 400 }) {
        const o = +getComputedStyle(node).opacity;
        return {
            delay,
            duration,
            css: t => `opacity: ${t * o}`
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

    /* src\Tabs.svelte generated by Svelte v3.5.1 */

    const file$1 = "src\\Tabs.svelte";

    function get_each_context(ctx, list, i) {
    	const child_ctx = Object.create(ctx);
    	child_ctx.title = list[i];
    	child_ctx.i = i;
    	return child_ctx;
    }

    // (75:4) {:else}
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
    			add_location(li, file$1, 75, 6, 1587);
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

    // (71:4) {#if i !== activeTab}
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
    			add_location(li, file$1, 71, 6, 1491);
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

    // (70:2) {#each currentTabs as title, i}
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

    // (90:4) {:else}
    function create_else_block$1(ctx) {
    	var div, dispose;

    	return {
    		c: function create() {
    			div = element("div");
    			div.textContent = "+";
    			div.className = "svelte-tibrtl";
    			add_location(div, file$1, 90, 6, 1952);
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

    // (82:4) {#if toggleTab}
    function create_if_block$1(ctx) {
    	var input, input_intro, dispose;

    	return {
    		c: function create() {
    			input = element("input");
    			input.id = "newTab";
    			attr(input, "type", "text");
    			input.autofocus = true;
    			add_location(input, file$1, 82, 6, 1732);

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
    			add_location(li, file$1, 80, 2, 1699);
    			ul.className = "svelte-tibrtl";
    			add_location(ul, file$1, 68, 0, 1417);
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
    	

      let currentTabs = ["Overview", "User View"];
      let activeTab = 0;

      function activate(tab) {
        console.log("activate tab", tab);
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

    /* src\StudyInfo.svelte generated by Svelte v3.5.1 */

    const file$2 = "src\\StudyInfo.svelte";

    function create_fragment$2(ctx) {
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
    			add_location(div0, file$2, 18, 2, 300);
    			add_location(div1, file$2, 19, 2, 333);
    			add_location(div2, file$2, 20, 2, 380);
    			add_location(div3, file$2, 21, 2, 440);
    			div4.id = "info";
    			div4.className = "svelte-1m3j3d9";
    			add_location(div4, file$2, 17, 0, 281);
    		},

    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
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
    		i: noop,
    		o: noop,

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(div4);
    			}
    		}
    	};
    }

    let name = "Test Study";

    let time = "78%";

    let participants = 27;

    let datasets = 1326;

    class StudyInfo extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, null, create_fragment$2, safe_not_equal, []);
    	}
    }

    /* src\UndoRedo.svelte generated by Svelte v3.5.1 */

    const file$3 = "src\\UndoRedo.svelte";

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
    			add_location(path0, file$3, 34, 4, 603);
    			attr(svg0, "id", "undo");
    			set_style(svg0, "width", "16px");
    			set_style(svg0, "height", "16px");
    			attr(svg0, "viewBox", "0 0 24 24");
    			attr(svg0, "class", "svelte-4zoca2");
    			add_location(svg0, file$3, 33, 2, 531);
    			label0.id = "undoLabel";
    			label0.className = "svelte-4zoca2";
    			add_location(label0, file$3, 40, 2, 824);
    			attr(path1, "fill", "#bbb");
    			attr(path1, "d", "M18.4,10.6C16.55,9 14.15,8 11.5,8C6.85,8 2.92,11.03\r\n      1.54,15.22L3.9,16C4.95,12.81 7.95,10.5 11.5,10.5C13.45,10.5 15.23,11.22\r\n      16.62,12.38L13,16H22V7L18.4,10.6Z");
    			add_location(path1, file$3, 42, 4, 934);
    			attr(svg1, "id", "redo");
    			set_style(svg1, "width", "16px");
    			set_style(svg1, "height", "16px");
    			attr(svg1, "viewBox", "0 0 24 24");
    			attr(svg1, "class", "svelte-4zoca2");
    			add_location(svg1, file$3, 41, 2, 862);
    			label1.id = "redoLabel";
    			label1.className = "svelte-4zoca2";
    			add_location(label1, file$3, 48, 2, 1158);
    			div.className = "svelte-4zoca2";
    			add_location(div, file$3, 32, 0, 522);
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

    /* src\MainChart.svelte generated by Svelte v3.5.1 */

    const file$4 = "src\\MainChart.svelte";

    function create_fragment$4(ctx) {
    	var div;

    	return {
    		c: function create() {
    			div = element("div");
    			div.id = "mainChart";
    			set_style(div, "width", "100%");
    			set_style(div, "height", "100%");
    			add_location(div, file$4, 86, 0, 3336);
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

    function instance$2($$self) {
    	onMount(() => {
        const mainChart = echarts.init(document.getElementById("mainChart"));

        // TODO find alternative for this workaround
        var hours = ['08:00', '', '09:00', '', '10:00', '', '11:00', '', '12:00', '', '13:00', '', '14:00', '', '15:00',
            '', '16:00', '', '17:00', '', '18:00', '', '19:00', '', '20:00', '', '21:00', '', '22:00', '', '23:00', '', '24:00'];
        var days = ['', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
        var data = 
        [[1,1,5],[1,3,3],[1,5,2],[1,7,1],[1,9,0],[1,11,0.5],[1,13,0.5],[1,15,3],[1,17,5],[1,19,5.5],[1,21,5.2],[1,23,6.1],[1,25,3],[1,27,6],[1,29,1],[1,31,2],
        [2,1,5],[2,3,2],[2,5,2],[2,7,0.5],[2,9,1],[2,11,1.5],[2,13,1.5],[2,15,3.5],[2,17,6],[2,19,4.5],[2,21,4.5],[2,23,5.5],[2,25,4],[2,27,5],[2,29,1.2],[2,31,5],
        [3,1,3],[3,3,1.5],[3,5,2],[3,7,1],[3,9,2],[3,11,2],[3,13,0.75],[3,15,2],[3,17,4],[3,19,3.5],[3,21,4],[3,23,5.75],[3,25,5],[3,27,3],[3,29,3],[3,31,2.5],
        [4,1,3.5],[4,3,2],[4,5,2],[4,7,2],[4,9,0.5],[4,11,1.5],[4,13,0.85],[4,15,1.5],[4,17,3],[4,19,5],[4,21,3.9],[4,23,4],[4,25,3.5],[4,27,4],[4,29,2],[4,31,3],
        [5,1,4],[5,3,1.4],[5,5,2],[5,7,1.5],[5,9,2],[5,11,0.5],[5,13,1.75],[5,15,2.85],[5,17,4.5],[5,19,5.1],[5,21,4.2],[5,23,3.5],[5,25,4],[5,27,4.5],[5,29,5],[5,31,4],
        [6,1,5],[6,3,1.5],[6,5,2],[6,7,1],[6,9,0],[6,11,0.75],[6,13,1.0],[6,15,2],[6,17,5.75],[6,19,4],[6,21,4.75],[6,23,6],[6,25,4.5],[6,27,3.23],[6,29,7],[6,31,0.5],
        [7,1,4.5],[7,3,1],[7,5,2],[7,7,0],[7,9,1],[7,11,1],[7,13,0.5],[7,15,3],[7,17,3],[7,19,4.75],[7,21,2],[7,23,5.5],[7,25,3.99],[7,27,6.5],[7,29,2],[7,31,1]];


        const option = {
          legend: {
            data: ['Average availability'],
            left: 'center'
          },
          tooltip: {
              position: 'top',
              formatter: function (params) {
                  // TODO implement function capable of translating params.value[1] into 'XX:00-XX:00'
                  return 'Average availability is ' + params.value[2];
              }
          },
          grid: {
              left: 2,
              bottom: 10,
              right: 90,
              containLabel: true
          },
          xAxis: {
              type: 'category',
              boundaryGap: false,
              name: 'Day of week',
              data: days,
              splitLine: {
                  show: true,
                  lineStyle: {
                      color: '#999',
                      type: 'dashed'
                  }
              },
              axisLine: {
                  show: true
              }
          },
          yAxis: {
              type: 'category',
              boundaryGap: false,
              name: 'Time of day',
              data: hours,
              axisLine: {
                  show: true
              }
          },
          series: [{
              name: 'Average availability',
              type: 'scatter',
              symbolSize: function (val) {
                  return val[2] * 6;
              },
              data: data,
              animationDelay: function (idx) {
                  return idx * 5;
              }
          }]
        };

        // use configuration item and data specified to show chart
        mainChart.setOption(option);
        window.addEventListener("resize", () => {
          if (mainChart !== null) {
            mainChart.resize();
          }
        });
      });

    	return {};
    }

    class MainChart extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$2, create_fragment$4, safe_not_equal, []);
    	}
    }

    /* src\MainChartSummary.svelte generated by Svelte v3.5.1 */

    const file$5 = "src\\MainChartSummary.svelte";

    function create_fragment$5(ctx) {
    	var div;

    	return {
    		c: function create() {
    			div = element("div");
    			div.id = "mainChartSummary";
    			set_style(div, "width", "100%");
    			set_style(div, "height", "100%");
    			add_location(div, file$5, 56, 0, 1848);
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
        const mainChartSummary = echarts.init(document.getElementById("mainChartSummary"));

        const option = {
            tooltip: {
                trigger: 'axis',
                formatter: "Average availability : <br/>{b}h : {c}"
            },
            grid: {
                left: '3%',
                right: '40%',
                bottom: '3%',
                containLabel: true
            },
            xAxis: {
                type: 'value',
                name: 'Avg. Avail.'
            },
            yAxis: {
                type: 'category',
                axisLine: {onZero: true},
                boundaryGap: false,
                name: 'Time of day',
                data: ['08:00', '', '09:00', '', '10:00', '', '11:00', '', '12:00', '', '13:00', '', '14:00', '', '15:00',
                '', '16:00', '', '17:00', '', '18:00', '', '19:00', '', '20:00', '', '21:00', '', '22:00', '', '23:00', '', '24:00']
            },
            series: [
                {
                    name: 'Average availability',
                    type: 'line',
                    smooth: false, // disable interpolation
                    lineStyle: {
                        normal: {
                            width: 3,
                            shadowColor: 'rgba(0,0,0,0.4)',
                            shadowBlur: 10,
                            shadowOffsetY: 10
                        }
                    },
                    data:[1, 2.5, 3.8, 7, 5, 4, 4, 4, 4, 5, 5, 5, 2, 2, 2, 3.5, 3.5, 3.5, 4, 4, 4, 4.5, 3, 3, 3, 3, 2.5, 2, 5, 6, 4, 3.75, 2]
                }
            ]
        };
        
        // use configuration item and data specified to show chart
        mainChartSummary.setOption(option);
        window.addEventListener("resize", () => {
          if (mainChartSummary !== null) {
            mainChartSummary.resize();
          }
        });
      });

    	return {};
    }

    class MainChartSummary extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$3, create_fragment$5, safe_not_equal, []);
    	}
    }

    /* src\Sherlock.svelte generated by Svelte v3.5.1 */

    const file$6 = "src\\Sherlock.svelte";

    function create_fragment$6(ctx) {
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
    			add_location(path, file$6, 263, 10, 5660);
    			attr(svg0, "fill", "#333");
    			attr(svg0, "xmlns", "http://www.w3.org/2000/svg");
    			attr(svg0, "xmlns:xlink", "http://www.w3.org/1999/xlink");
    			attr(svg0, "version", "1.1");
    			attr(svg0, "x", "0px");
    			attr(svg0, "y", "0px");
    			attr(svg0, "viewBox", "-909 491 100 100");
    			set_style(svg0, "enable-background", "new -909 491 100 100");
    			attr(svg0, "xml:space", "preserve");
    			add_location(svg0, file$6, 253, 8, 5328);
    			attr(g0, "transform", "translate(600 600) scale(-0.69 0.69) translate(-600 -600)");
    			add_location(g0, file$6, 252, 6, 5245);
    			add_location(g1, file$6, 251, 4, 5234);
    			attr(svg1, "xmlns", "http://www.w3.org/2000/svg");
    			attr(svg1, "xmlns:xlink", "http://www.w3.org/1999/xlink");
    			attr(svg1, "width", "36");
    			attr(svg1, "height", "36");
    			attr(svg1, "viewBox", "0 0 1200 1200");
    			add_location(svg1, file$6, 245, 2, 5073);
    			add_location(span, file$6, 295, 2, 8734);
    			div0.id = "sherlockHeader";
    			div0.className = "svelte-nary1h";
    			add_location(div0, file$6, 244, 0, 5044);
    			div1.id = "sherlockChart";
    			div1.className = "svelte-nary1h";
    			add_location(div1, file$6, 297, 0, 8765);
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

    function instance$4($$self) {
    	onMount(() => {
        const sherlockChart = echarts.init(
          document.getElementById("sherlockChart")
        );
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

        window.addEventListener("resize", () => {
          if (sherlockChart !== null) {
            sherlockChart.resize();
          }
        });
      });

    	return {};
    }

    class Sherlock extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$4, create_fragment$6, safe_not_equal, []);
    	}
    }

    /* src\Anova.svelte generated by Svelte v3.5.1 */

    const file$7 = "src\\Anova.svelte";

    function create_fragment$7(ctx) {
    	var div;

    	return {
    		c: function create() {
    			div = element("div");
    			div.id = "anovaChart";
    			div.className = "svelte-1a6ghsc";
    			add_location(div, file$7, 147, 0, 3410);
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
        const anovaChart = echarts.init(document.getElementById("anovaChart"));
        const categoryData = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
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
            stroke: "#888",
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
                  color: "#96bcdb"
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

        window.addEventListener("resize", () => {
          if (anovaChart !== null) {
            anovaChart.resize();
          }
        });
      });

    	return {};
    }

    class Anova extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$5, create_fragment$7, safe_not_equal, []);
    	}
    }

    /* src\PageOverview.svelte generated by Svelte v3.5.1 */

    const file$8 = "src\\PageOverview.svelte";

    function create_fragment$8(ctx) {
    	var div3, div0, t0, div1, t1, leftOAside, t3, aside, t4, div2, div3_intro, current;

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
    			leftOAside = element("leftOAside");
    			leftOAside.textContent = "Filters go here";
    			t3 = space();
    			aside = element("aside");
    			sherlock.$$.fragment.c();
    			t4 = space();
    			div2 = element("div");
    			anova.$$.fragment.c();
    			div0.className = "mainChart svelte-y99zse";
    			add_location(div0, file$8, 51, 2, 1188);
    			div1.className = "mainChartSummary svelte-y99zse";
    			add_location(div1, file$8, 54, 2, 1244);
    			leftOAside.className = "svelte-y99zse";
    			add_location(leftOAside, file$8, 57, 2, 1314);
    			aside.className = "svelte-y99zse";
    			add_location(aside, file$8, 61, 2, 1405);
    			div2.className = "anova svelte-y99zse";
    			add_location(div2, file$8, 64, 2, 1446);
    			div3.className = "overview svelte-y99zse";
    			add_location(div3, file$8, 50, 0, 1134);
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
    			append(div3, leftOAside);
    			append(div3, t3);
    			append(div3, aside);
    			mount_component(sherlock, aside, null);
    			append(div3, t4);
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

    class PageOverview extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, null, create_fragment$8, safe_not_equal, []);
    	}
    }

    /* src\WeekChart.svelte generated by Svelte v3.5.1 */

    const file$9 = "src\\WeekChart.svelte";

    function create_fragment$9(ctx) {
    	var div;

    	return {
    		c: function create() {
    			div = element("div");
    			div.id = "weekChart";
    			div.className = "svelte-uu58md";
    			add_location(div, file$9, 281, 0, 5286);
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
    	onMount(() => {
        const weekChart = echarts.init(document.getElementById("weekChart"));

        const hours = [
          "12a",
          "1a",
          "2a",
          "3a",
          "4a",
          "5a",
          "6a",
          "7a",
          "8a",
          "9a",
          "10a",
          "11a",
          "12p",
          "1p",
          "2p",
          "3p",
          "4p",
          "5p",
          "6p",
          "7p",
          "8p",
          "9p",
          "10p",
          "11p"
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

        window.addEventListener("resize", () => {
          if (weekChart !== null) {
            weekChart.resize();
          }
        });
      });

    	return {};
    }

    class WeekChart extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$6, create_fragment$9, safe_not_equal, []);
    	}
    }

    /* src\BDAChart.svelte generated by Svelte v3.5.1 */

    const file$a = "src\\BDAChart.svelte";

    function create_fragment$a(ctx) {
    	var div;

    	return {
    		c: function create() {
    			div = element("div");
    			div.id = "BDAChart";
    			div.className = "svelte-1j0o2bd";
    			add_location(div, file$a, 62, 0, 1189);
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
        const BDAChart = echarts.init(document.getElementById("BDAChart"));
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

        window.addEventListener("resize", () => {
          if (BDAChart !== null) {
            BDAChart.resize();
          }
        });
      });

    	return {};
    }

    class BDAChart extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$7, create_fragment$a, safe_not_equal, []);
    	}
    }

    /* src\ContextPie.svelte generated by Svelte v3.5.1 */

    const file$b = "src\\ContextPie.svelte";

    function create_fragment$b(ctx) {
    	var div;

    	return {
    		c: function create() {
    			div = element("div");
    			div.id = "ContextPieChart";
    			div.className = "svelte-8xdxio";
    			add_location(div, file$b, 92, 0, 2089);
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
        const ContextPieChart = echarts.init(
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

        window.addEventListener("resize", () => {
          if (ContextPieChart !== null) {
            ContextPieChart.resize();
          }
        });
      });

    	return {};
    }

    class ContextPie extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$8, create_fragment$b, safe_not_equal, []);
    	}
    }

    /* src\PageUserview.svelte generated by Svelte v3.5.1 */

    const file$c = "src\\PageUserview.svelte";

    function create_fragment$c(ctx) {
    	var div7, select, option0, option1, option2, option3, option4, t5, div6, div0, t6, div1, t7, div2, t8, div3, t9, div5, div4, svg, path, t10, div7_intro, current;

    	var anova = new Anova({ $$inline: true });

    	var weekchart = new WeekChart({ $$inline: true });

    	var bdachart = new BDAChart({ $$inline: true });

    	var contextpie = new ContextPie({ $$inline: true });

    	return {
    		c: function create() {
    			div7 = element("div");
    			select = element("select");
    			option0 = element("option");
    			option0.textContent = "User 1 | avg. availability: 6.3 | responses: 223";
    			option1 = element("option");
    			option1.textContent = "User 2 | avg. availability: 2.3 | responses: 124";
    			option2 = element("option");
    			option2.textContent = "User 3 | avg. availability: 3.1 | responses: 24";
    			option3 = element("option");
    			option3.textContent = "User 4 | avg. availability: 4.3 | responses: 424";
    			option4 = element("option");
    			option4.textContent = "User 5 | avg. availability: 3.3 | responses: 254";
    			t5 = space();
    			div6 = element("div");
    			div0 = element("div");
    			anova.$$.fragment.c();
    			t6 = space();
    			div1 = element("div");
    			weekchart.$$.fragment.c();
    			t7 = space();
    			div2 = element("div");
    			bdachart.$$.fragment.c();
    			t8 = space();
    			div3 = element("div");
    			contextpie.$$.fragment.c();
    			t9 = space();
    			div5 = element("div");
    			div4 = element("div");
    			svg = svg_element("svg");
    			path = svg_element("path");
    			t10 = text("\r\n        Add new widget");
    			option0.__value = "1";
    			option0.value = option0.__value;
    			add_location(option0, file$c, 42, 4, 923);
    			option1.__value = "2";
    			option1.value = option1.__value;
    			add_location(option1, file$c, 43, 4, 1004);
    			option2.__value = "3";
    			option2.value = option2.__value;
    			add_location(option2, file$c, 44, 4, 1085);
    			option3.__value = "4";
    			option3.value = option3.__value;
    			add_location(option3, file$c, 45, 4, 1165);
    			option4.__value = "5";
    			option4.value = option4.__value;
    			add_location(option4, file$c, 46, 4, 1246);
    			select.name = "user";
    			select.id = "userSelect";
    			add_location(select, file$c, 41, 2, 881);
    			div0.className = "widget svelte-isych5";
    			add_location(div0, file$c, 49, 4, 1373);
    			div1.className = "widget svelte-isych5";
    			add_location(div1, file$c, 52, 4, 1428);
    			div2.className = "widget svelte-isych5";
    			add_location(div2, file$c, 55, 4, 1487);
    			div3.className = "widget svelte-isych5";
    			add_location(div3, file$c, 58, 4, 1545);
    			attr(path, "fill", "#333");
    			attr(path, "d", "M12,20C7.59,20 4,16.41 4,12C4,7.59 7.59,4 12,4C16.41,4 20,7.59\r\n            20,12C20,16.41 16.41,20 12,20M12,2A10,10 0 0,0 2,12A10,10 0 0,0\r\n            12,22A10,10 0 0,0 22,12A10,10 0 0,0\r\n            12,2M13,7H11V11H7V13H11V17H13V13H17V11H13V7Z");
    			add_location(path, file$c, 64, 10, 1734);
    			set_style(svg, "width", "50px");
    			set_style(svg, "height", "50px");
    			attr(svg, "viewBox", "0 0 24 24");
    			add_location(svg, file$c, 63, 8, 1666);
    			div4.className = "addWidget svelte-isych5";
    			add_location(div4, file$c, 62, 6, 1633);
    			div5.className = "widget svelte-isych5";
    			add_location(div5, file$c, 61, 4, 1605);
    			div6.className = "widgetContainer svelte-isych5";
    			add_location(div6, file$c, 48, 2, 1338);
    			div7.className = "userview svelte-isych5";
    			add_location(div7, file$c, 40, 0, 827);
    		},

    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},

    		m: function mount(target, anchor) {
    			insert(target, div7, anchor);
    			append(div7, select);
    			append(select, option0);
    			append(select, option1);
    			append(select, option2);
    			append(select, option3);
    			append(select, option4);
    			append(div7, t5);
    			append(div7, div6);
    			append(div6, div0);
    			mount_component(anova, div0, null);
    			append(div6, t6);
    			append(div6, div1);
    			mount_component(weekchart, div1, null);
    			append(div6, t7);
    			append(div6, div2);
    			mount_component(bdachart, div2, null);
    			append(div6, t8);
    			append(div6, div3);
    			mount_component(contextpie, div3, null);
    			append(div6, t9);
    			append(div6, div5);
    			append(div5, div4);
    			append(div4, svg);
    			append(svg, path);
    			append(div4, t10);
    			current = true;
    		},

    		p: noop,

    		i: function intro(local) {
    			if (current) return;
    			anova.$$.fragment.i(local);

    			weekchart.$$.fragment.i(local);

    			bdachart.$$.fragment.i(local);

    			contextpie.$$.fragment.i(local);

    			if (!div7_intro) {
    				add_render_callback(() => {
    					div7_intro = create_in_transition(div7, fade, { duration: 300 });
    					div7_intro.start();
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
    				detach(div7);
    			}

    			anova.$destroy();

    			weekchart.$destroy();

    			bdachart.$destroy();

    			contextpie.$destroy();
    		}
    	};
    }

    class PageUserview extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, null, create_fragment$c, safe_not_equal, []);
    	}
    }

    /* src\SenseQVis.svelte generated by Svelte v3.5.1 */

    const file$d = "src\\SenseQVis.svelte";

    // (88:4) {:else}
    function create_else_block$2(ctx) {
    	var current;

    	var pageuserview = new PageUserview({ $$inline: true });

    	return {
    		c: function create() {
    			pageuserview.$$.fragment.c();
    		},

    		m: function mount(target, anchor) {
    			mount_component(pageuserview, target, anchor);
    			current = true;
    		},

    		i: function intro(local) {
    			if (current) return;
    			pageuserview.$$.fragment.i(local);

    			current = true;
    		},

    		o: function outro(local) {
    			pageuserview.$$.fragment.o(local);
    			current = false;
    		},

    		d: function destroy(detaching) {
    			pageuserview.$destroy(detaching);
    		}
    	};
    }

    // (86:4) {#if activeTab === 0}
    function create_if_block$2(ctx) {
    	var current;

    	var pageoverview = new PageOverview({ $$inline: true });

    	return {
    		c: function create() {
    			pageoverview.$$.fragment.c();
    		},

    		m: function mount(target, anchor) {
    			mount_component(pageoverview, target, anchor);
    			current = true;
    		},

    		i: function intro(local) {
    			if (current) return;
    			pageoverview.$$.fragment.i(local);

    			current = true;
    		},

    		o: function outro(local) {
    			pageoverview.$$.fragment.o(local);
    			current = false;
    		},

    		d: function destroy(detaching) {
    			pageoverview.$destroy(detaching);
    		}
    	};
    }

    function create_fragment$d(ctx) {
    	var main, header, t0, nav, div0, t1, div1, t2, section, current_block_type_index, if_block, current;

    	var studyinfo = new StudyInfo({ $$inline: true });

    	var tabs = new Tabs({ $$inline: true });

    	var undoredo = new UndoRedo({ $$inline: true });

    	var if_block_creators = [
    		create_if_block$2,
    		create_else_block$2
    	];

    	var if_blocks = [];

    	function select_block_type(ctx) {
    		if (ctx.activeTab === 0) return 0;
    		return 1;
    	}

    	current_block_type_index = select_block_type(ctx);
    	if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);

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
    			if_block.c();
    			header.className = "svelte-7e2twn";
    			add_location(header, file$d, 73, 2, 1544);
    			div0.className = "tabs svelte-7e2twn";
    			add_location(div0, file$d, 77, 4, 1599);
    			div1.className = "undoRedo svelte-7e2twn";
    			add_location(div1, file$d, 80, 4, 1651);
    			nav.className = "svelte-7e2twn";
    			add_location(nav, file$d, 76, 2, 1588);
    			section.className = "svelte-7e2twn";
    			add_location(section, file$d, 84, 2, 1719);
    			main.className = "svelte-7e2twn";
    			add_location(main, file$d, 72, 0, 1534);
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
    			if_blocks[current_block_type_index].m(section, null);
    			current = true;
    		},

    		p: function update(changed, ctx) {
    			var previous_block_index = current_block_type_index;
    			current_block_type_index = select_block_type(ctx);
    			if (current_block_type_index !== previous_block_index) {
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
    				if_block.m(section, null);
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

    			if_blocks[current_block_type_index].d();
    		}
    	};
    }

    function instance$9($$self, $$props, $$invalidate) {
    	

      let activeTab = 0;
      activeUITab.subscribe(async v => {
        console.log("subscription", v);
        $$invalidate('activeTab', activeTab = v);
      });

    	return { activeTab };
    }

    class SenseQVis extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$9, create_fragment$d, safe_not_equal, []);
    	}
    }

    const app = new SenseQVis({
    	target: document.body,
    });

    return app;

}());
