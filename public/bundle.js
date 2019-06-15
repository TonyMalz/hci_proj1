
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

    /* src\Tabs.svelte generated by Svelte v3.5.1 */

    const file$1 = "src\\Tabs.svelte";

    function get_each_context(ctx, list, i) {
    	const child_ctx = Object.create(ctx);
    	child_ctx.title = list[i];
    	child_ctx.i = i;
    	return child_ctx;
    }

    // (74:4) {:else}
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
    			add_location(li, file$1, 74, 6, 1577);
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

    // (70:4) {#if i !== activeTab}
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
    			add_location(li, file$1, 70, 6, 1481);
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

    // (69:2) {#each currentTabs as title, i}
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

    // (89:4) {:else}
    function create_else_block$1(ctx) {
    	var div, dispose;

    	return {
    		c: function create() {
    			div = element("div");
    			div.textContent = "+";
    			div.className = "svelte-tibrtl";
    			add_location(div, file$1, 89, 6, 1942);
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

    // (81:4) {#if toggleTab}
    function create_if_block$1(ctx) {
    	var input, input_intro, dispose;

    	return {
    		c: function create() {
    			input = element("input");
    			input.id = "newTab";
    			attr(input, "type", "text");
    			input.autofocus = true;
    			add_location(input, file$1, 81, 6, 1722);

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
    			add_location(li, file$1, 79, 2, 1689);
    			ul.className = "svelte-tibrtl";
    			add_location(ul, file$1, 67, 0, 1407);
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
    	

      let currentTabs = ["Overview", "User Details"];
      let { activeTab = 0 } = $$props;
      function activate(tab) {
        console.log("activate");
        $$invalidate('activeTab', activeTab = tab);
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

    	const writable_props = ['activeTab'];
    	Object.keys($$props).forEach(key => {
    		if (!writable_props.includes(key) && !key.startsWith('$$')) console.warn(`<Tabs> was created with unknown prop '${key}'`);
    	});

    	function click_handler({ i }) {
    		return activate(i);
    	}

    	function keydown_handler(e) {
    		return (e.code === 'Enter' ? addTab() : null);
    	}

    	$$self.$set = $$props => {
    		if ('activeTab' in $$props) $$invalidate('activeTab', activeTab = $$props.activeTab);
    	};

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
    		init(this, options, instance$1, create_fragment$1, safe_not_equal, ["activeTab"]);
    	}

    	get activeTab() {
    		throw new Error("<Tabs>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set activeTab(value) {
    		throw new Error("<Tabs>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
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
    			add_location(div, file$4, 311, 0, 9199);
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

        const dataBJ = [
          [1, 55, 9, 56, 0.46, 18, 6, "良"],
          [2, 25, 11, 21, 0.65, 34, 9, "优"],
          [3, 56, 7, 63, 0.3, 14, 5, "良"],
          [4, 33, 7, 29, 0.33, 16, 6, "优"],
          [5, 42, 24, 44, 0.76, 40, 16, "优"],
          [6, 82, 58, 90, 1.77, 68, 33, "良"],
          [7, 74, 49, 77, 1.46, 48, 27, "良"],
          [8, 78, 55, 80, 1.29, 59, 29, "良"],
          [9, 267, 216, 280, 4.8, 108, 64, "重度污染"],
          [10, 185, 127, 216, 2.52, 61, 27, "中度污染"],
          [11, 39, 19, 38, 0.57, 31, 15, "优"],
          [12, 41, 11, 40, 0.43, 21, 7, "优"],
          [13, 64, 38, 74, 1.04, 46, 22, "良"],
          [14, 108, 79, 120, 1.7, 75, 41, "轻度污染"],
          [15, 108, 63, 116, 1.48, 44, 26, "轻度污染"],
          [16, 33, 6, 29, 0.34, 13, 5, "优"],
          [17, 94, 66, 110, 1.54, 62, 31, "良"],
          [18, 186, 142, 192, 3.88, 93, 79, "中度污染"],
          [19, 57, 31, 54, 0.96, 32, 14, "良"],
          [20, 22, 8, 17, 0.48, 23, 10, "优"],
          [21, 39, 15, 36, 0.61, 29, 13, "优"],
          [22, 94, 69, 114, 2.08, 73, 39, "良"],
          [23, 99, 73, 110, 2.43, 76, 48, "良"],
          [24, 31, 12, 30, 0.5, 32, 16, "优"],
          [25, 42, 27, 43, 1, 53, 22, "优"],
          [26, 154, 117, 157, 3.05, 92, 58, "中度污染"],
          [27, 234, 185, 230, 4.09, 123, 69, "重度污染"],
          [28, 160, 120, 186, 2.77, 91, 50, "中度污染"],
          [29, 134, 96, 165, 2.76, 83, 41, "轻度污染"],
          [30, 52, 24, 60, 1.03, 50, 21, "良"]
        ];

        const dataGZ = [
          [1, 26, 37, 27, 1.163, 27, 13, "优"],
          [2, 85, 62, 71, 1.195, 60, 8, "良"],
          [3, 78, 38, 74, 1.363, 37, 7, "良"],
          [4, 21, 21, 36, 0.634, 40, 9, "优"],
          [5, 41, 42, 46, 0.915, 81, 13, "优"],
          [6, 56, 52, 69, 1.067, 92, 16, "良"],
          [7, 64, 30, 28, 0.924, 51, 2, "良"],
          [8, 55, 48, 74, 1.236, 75, 26, "良"],
          [9, 76, 85, 113, 1.237, 114, 27, "良"],
          [10, 91, 81, 104, 1.041, 56, 40, "良"],
          [11, 84, 39, 60, 0.964, 25, 11, "良"],
          [12, 64, 51, 101, 0.862, 58, 23, "良"],
          [13, 70, 69, 120, 1.198, 65, 36, "良"],
          [14, 77, 105, 178, 2.549, 64, 16, "良"],
          [15, 109, 68, 87, 0.996, 74, 29, "轻度污染"],
          [16, 73, 68, 97, 0.905, 51, 34, "良"],
          [17, 54, 27, 47, 0.592, 53, 12, "良"],
          [18, 51, 61, 97, 0.811, 65, 19, "良"],
          [19, 91, 71, 121, 1.374, 43, 18, "良"],
          [20, 73, 102, 182, 2.787, 44, 19, "良"],
          [21, 73, 50, 76, 0.717, 31, 20, "良"],
          [22, 84, 94, 140, 2.238, 68, 18, "良"],
          [23, 93, 77, 104, 1.165, 53, 7, "良"],
          [24, 99, 130, 227, 3.97, 55, 15, "良"],
          [25, 146, 84, 139, 1.094, 40, 17, "轻度污染"],
          [26, 113, 108, 137, 1.481, 48, 15, "轻度污染"],
          [27, 81, 48, 62, 1.619, 26, 3, "良"],
          [28, 56, 48, 68, 1.336, 37, 9, "良"],
          [29, 82, 92, 174, 3.29, 0, 13, "良"],
          [30, 106, 116, 188, 3.628, 101, 16, "轻度污染"]
        ];

        const dataSH = [
          [1, 91, 45, 125, 0.82, 34, 23, "良"],
          [2, 65, 27, 78, 0.86, 45, 29, "良"],
          [3, 83, 60, 84, 1.09, 73, 27, "良"],
          [4, 109, 81, 121, 1.28, 68, 51, "轻度污染"],
          [5, 106, 77, 114, 1.07, 55, 51, "轻度污染"],
          [6, 109, 81, 121, 1.28, 68, 51, "轻度污染"],
          [7, 106, 77, 114, 1.07, 55, 51, "轻度污染"],
          [8, 89, 65, 78, 0.86, 51, 26, "良"],
          [9, 53, 33, 47, 0.64, 50, 17, "良"],
          [10, 80, 55, 80, 1.01, 75, 24, "良"],
          [11, 117, 81, 124, 1.03, 45, 24, "轻度污染"],
          [12, 99, 71, 142, 1.1, 62, 42, "良"],
          [13, 95, 69, 130, 1.28, 74, 50, "良"],
          [14, 116, 87, 131, 1.47, 84, 40, "轻度污染"],
          [15, 108, 80, 121, 1.3, 85, 37, "轻度污染"],
          [16, 134, 83, 167, 1.16, 57, 43, "轻度污染"],
          [17, 79, 43, 107, 1.05, 59, 37, "良"],
          [18, 71, 46, 89, 0.86, 64, 25, "良"],
          [19, 97, 71, 113, 1.17, 88, 31, "良"],
          [20, 84, 57, 91, 0.85, 55, 31, "良"],
          [21, 87, 63, 101, 0.9, 56, 41, "良"],
          [22, 104, 77, 119, 1.09, 73, 48, "轻度污染"],
          [23, 87, 62, 100, 1, 72, 28, "良"],
          [24, 168, 128, 172, 1.49, 97, 56, "中度污染"],
          [25, 65, 45, 51, 0.74, 39, 17, "良"],
          [26, 39, 24, 38, 0.61, 47, 17, "优"],
          [27, 39, 24, 39, 0.59, 50, 19, "优"],
          [28, 93, 68, 96, 1.05, 79, 29, "良"],
          [29, 188, 143, 197, 1.66, 99, 51, "中度污染"],
          [30, 174, 131, 174, 1.55, 108, 50, "中度污染"]
        ];

        const schema = [
          { name: "date", index: 0, text: "Day" },
          { name: "AQIindex", index: 1, text: "AQI" },
          { name: "PM25", index: 2, text: "Workload" },
          { name: "PM10", index: 3, text: "PM10" },
          { name: "CO", index: 4, text: "(CO)" },
          { name: "NO2", index: 5, text: "(NO2)" },
          { name: "SO2", index: 6, text: "(SO2)" }
        ];

        const itemStyle = {
          normal: {
            opacity: 0.8,
            shadowBlur: 10,
            shadowOffsetX: 0,
            shadowOffsetY: 0,
            shadowColor: "rgba(0, 0, 0, 0.5)"
          }
        };

        const option = {
          backgroundColor: "#fff",
          color: ["#be5e5e", "#fec42c", "#7ad6ad"],
          legend: {
            y: "top",
            data: ["Angry", "Calm", "Happy"],
            textStyle: {
              color: "#333",
              fontSize: 14
            }
          },
          grid: {
            x: 36,
            x2: "17%",
            y: 40,
            y2: 40
          },
          tooltip: {
            padding: 10,
            backgroundColor: "#333",
            borderColor: "#777",
            borderWidth: 1,
            formatter: function(obj) {
              const value = obj.value;
              return (
                '<div style="border-bottom: 1px solid rgba(255,255,255,.3); font-size: 14px;padding-bottom: 7px;margin-bottom: 7px">' +
                obj.seriesName +
                " " +
                `Day：${value[0]} ` +
                // + value[7]
                "</div>" +
                schema[1].text +
                "：" +
                value[1] +
                "<br>" +
                schema[2].text +
                "：" +
                value[2] +
                "<br>" +
                schema[3].text +
                "：" +
                value[3] +
                "<br>" +
                schema[4].text +
                "：" +
                value[4] +
                "<br>" +
                schema[5].text +
                "：" +
                value[5] +
                "<br>" +
                schema[6].text +
                "：" +
                value[6] +
                "<br>"
              );
            }
          },
          xAxis: {
            type: "value",
            name: "Day",
            nameGap: 16,
            nameTextStyle: {
              color: "#333",
              fontSize: 14
            },
            max: 30,
            splitLine: {
              show: true
            },
            axisLine: {
              lineStyle: {
                color: "#333"
              }
            }
          },
          yAxis: {
            type: "value",
            name: "Availability",
            nameLocation: "end",
            nameGap: 16,
            nameTextStyle: {
              color: "#333",
              fontSize: 14
            },
            axisLine: {
              lineStyle: {
                color: "#333"
              }
            },
            splitLine: {
              show: false
            }
          },
          visualMap: [
            {
              left: "87%",
              top: 10,
              dimension: 2,
              min: 0,
              max: 250,
              itemWidth: 20,
              itemHeight: 50,
              calculable: true,
              precision: 0.1,
              text: [schema[2].text],
              textGap: 18,
              textStyle: {
                color: "#333"
              },
              inRange: {
                symbolSize: [10, 70]
              },
              outOfRange: {
                symbolSize: [10, 70],
                color: ["rgba(255,255,255,.2)"]
              },
              controller: {
                inRange: {
                  color: ["#777"]
                },
                outOfRange: {
                  color: ["#444"]
                }
              }
            },
            {
              left: "87%",
              top: 140,
              dimension: 6,
              min: 0,
              max: 50,
              itemWidth: 20,
              itemHeight: 50,
              calculable: true,
              precision: 0.1,
              text: [schema[6].text],
              textGap: 18,
              textStyle: {
                color: "#333"
              },
              inRange: {},
              outOfRange: {
                color: ["rgba(255,255,255,.2)"]
              },
              controller: {
                inRange: {
                  color: ["teal"]
                },
                outOfRange: {
                  color: ["#444"]
                }
              }
            }
          ],
          series: [
            {
              name: "Angry",
              type: "scatter",
              itemStyle: itemStyle,
              data: dataBJ
            },
            {
              name: "Calm",
              type: "scatter",
              itemStyle: itemStyle,
              data: dataSH
            },
            {
              name: "Happy",
              type: "scatter",
              itemStyle: itemStyle,
              data: dataGZ
            }
          ]
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

    /* src\Anova.svelte generated by Svelte v3.5.1 */

    const file$5 = "src\\Anova.svelte";

    function create_fragment$5(ctx) {
    	var div;

    	return {
    		c: function create() {
    			div = element("div");
    			div.id = "anovaChart";
    			div.className = "svelte-15kplwv";
    			add_location(div, file$5, 143, 0, 3260);
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
        const anovaChart = echarts.init(document.getElementById("anovaChart"));
        const categoryData = [];
        const errorData = [];
        const barData = [];
        const dataCount = 7;
        for (var i = 0; i < dataCount; i++) {
          var val = Math.random() * 7;
          categoryData.push("Day" + (i + 1));
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
          yAxis: {},
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
    		init(this, options, instance$3, create_fragment$5, safe_not_equal, []);
    	}
    }

    /* src\SenseQVis.svelte generated by Svelte v3.5.1 */

    const file$6 = "src\\SenseQVis.svelte";

    function create_fragment$6(ctx) {
    	var main, header, t0, nav, div0, t1, div1, t2, section, div2, button, t4, t5, aside, t7, div3, current, dispose;

    	var studyinfo = new StudyInfo({ $$inline: true });

    	var tabs = new Tabs({
    		props: { activeTab: ctx.activeTab },
    		$$inline: true
    	});

    	var undoredo = new UndoRedo({ $$inline: true });

    	var mainchart = new MainChart({ $$inline: true });

    	var anova = new Anova({ $$inline: true });

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
    			div2 = element("div");
    			button = element("button");
    			button.textContent = "change tabs";
    			t4 = space();
    			mainchart.$$.fragment.c();
    			t5 = space();
    			aside = element("aside");
    			aside.textContent = "AI Charts";
    			t7 = space();
    			div3 = element("div");
    			anova.$$.fragment.c();
    			header.className = "svelte-1cf3a4o";
    			add_location(header, file$6, 87, 2, 1816);
    			div0.className = "tabs svelte-1cf3a4o";
    			add_location(div0, file$6, 91, 4, 1871);
    			div1.className = "undoRedo svelte-1cf3a4o";
    			add_location(div1, file$6, 94, 4, 1935);
    			nav.className = "svelte-1cf3a4o";
    			add_location(nav, file$6, 90, 2, 1860);
    			button.className = "svelte-1cf3a4o";
    			add_location(button, file$6, 100, 6, 2046);
    			div2.id = "mainChart";
    			div2.className = "svelte-1cf3a4o";
    			add_location(div2, file$6, 99, 4, 2018);
    			aside.className = "svelte-1cf3a4o";
    			add_location(aside, file$6, 103, 4, 2131);
    			div3.id = "anova";
    			div3.className = "svelte-1cf3a4o";
    			add_location(div3, file$6, 104, 4, 2161);
    			section.className = "svelte-1cf3a4o";
    			add_location(section, file$6, 98, 2, 2003);
    			main.className = "svelte-1cf3a4o";
    			add_location(main, file$6, 86, 0, 1806);
    			dispose = listen(button, "click", ctx.toggle);
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
    			append(section, div2);
    			append(div2, button);
    			append(div2, t4);
    			mount_component(mainchart, div2, null);
    			append(section, t5);
    			append(section, aside);
    			append(section, t7);
    			append(section, div3);
    			mount_component(anova, div3, null);
    			current = true;
    		},

    		p: function update(changed, ctx) {
    			var tabs_changes = {};
    			if (changed.activeTab) tabs_changes.activeTab = ctx.activeTab;
    			tabs.$set(tabs_changes);
    		},

    		i: function intro(local) {
    			if (current) return;
    			studyinfo.$$.fragment.i(local);

    			tabs.$$.fragment.i(local);

    			undoredo.$$.fragment.i(local);

    			mainchart.$$.fragment.i(local);

    			anova.$$.fragment.i(local);

    			current = true;
    		},

    		o: function outro(local) {
    			studyinfo.$$.fragment.o(local);
    			tabs.$$.fragment.o(local);
    			undoredo.$$.fragment.o(local);
    			mainchart.$$.fragment.o(local);
    			anova.$$.fragment.o(local);
    			current = false;
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(main);
    			}

    			studyinfo.$destroy();

    			tabs.$destroy();

    			undoredo.$destroy();

    			mainchart.$destroy();

    			anova.$destroy();

    			dispose();
    		}
    	};
    }

    function instance$4($$self, $$props, $$invalidate) {
    	

      let activeTab = 0;
      function toggle() {
        $$invalidate('activeTab', activeTab = activeTab == 0 ? 1 : 0);
      }

    	return { activeTab, toggle };
    }

    class SenseQVis extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$4, create_fragment$6, safe_not_equal, []);
    	}
    }

    const app = new SenseQVis({
    	target: document.body,
    });

    return app;

}());
