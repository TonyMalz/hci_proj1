
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
            task = loop(now$$1 => {
                if (running) {
                    if (now$$1 >= end_time) {
                        tick$$1(1, 0);
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
                if (typeof config === 'function') {
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
                $$.fragment.l(children(options.target));
            }
            else {
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

    /* src/Tab.svelte generated by Svelte v3.4.4 */

    const file = "src/Tab.svelte";

    // (35:0) {:else}
    function create_else_block(ctx) {
    	var span, t, dispose;

    	return {
    		c: function create() {
    			span = element("span");
    			t = text(ctx.title);
    			span.className = "svelte-xts7x";
    			add_location(span, file, 35, 2, 680);
    			dispose = listen(span, "click", ctx.toggleEdit);
    		},

    		m: function mount(target, anchor) {
    			insert(target, span, anchor);
    			append(span, t);
    		},

    		p: function update_1(changed, ctx) {
    			if (changed.title) {
    				set_data(t, ctx.title);
    			}
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(span);
    			}

    			dispose();
    		}
    	};
    }

    // (33:0) {#if toggle}
    function create_if_block(ctx) {
    	var input, dispose;

    	return {
    		c: function create() {
    			input = element("input");
    			attr(input, "type", "text");
    			input.autofocus = true;
    			input.className = "svelte-xts7x";
    			add_location(input, file, 33, 2, 600);

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
      function update() {
        console.log("blur");
        toggleEdit();
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

    /* src/Tabs.svelte generated by Svelte v3.4.4 */

    const file$1 = "src/Tabs.svelte";

    function get_each_context(ctx, list, i) {
    	const child_ctx = Object.create(ctx);
    	child_ctx.title = list[i];
    	child_ctx.i = i;
    	return child_ctx;
    }

    // (76:4) {:else}
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
    			li.className = "active svelte-12elh9g";
    			add_location(li, file$1, 76, 6, 1577);
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

    // (72:4) {#if i !== activeTab}
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
    			li.className = "svelte-12elh9g";
    			add_location(li, file$1, 72, 6, 1481);
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

    // (71:2) {#each currentTabs as title, i}
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

    // (91:4) {:else}
    function create_else_block$1(ctx) {
    	var span, dispose;

    	return {
    		c: function create() {
    			span = element("span");
    			span.textContent = "+";
    			span.className = "svelte-12elh9g";
    			add_location(span, file$1, 91, 6, 1942);
    			dispose = listen(span, "click", ctx.toggle);
    		},

    		m: function mount(target, anchor) {
    			insert(target, span, anchor);
    		},

    		p: noop,
    		i: noop,
    		o: noop,

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(span);
    			}

    			dispose();
    		}
    	};
    }

    // (83:4) {#if toggleTab}
    function create_if_block$1(ctx) {
    	var input, input_intro, dispose;

    	return {
    		c: function create() {
    			input = element("input");
    			input.id = "newTab";
    			attr(input, "type", "text");
    			input.autofocus = true;
    			input.className = "svelte-12elh9g";
    			add_location(input, file$1, 83, 6, 1722);

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
    			li.className = "svelte-12elh9g";
    			add_location(li, file$1, 81, 2, 1689);
    			ul.className = "svelte-12elh9g";
    			add_location(ul, file$1, 69, 0, 1407);
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
    			for (let i = 0; i < each_blocks.length; i += 1) outro_block(i, 0);

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

    /* src/App.svelte generated by Svelte v3.4.4 */

    const file$2 = "src/App.svelte";

    function create_fragment$2(ctx) {
    	var main, header, t1, nav, t2, article, div, button, t4, aside, t6, footer, current, dispose;

    	var tabs = new Tabs({
    		props: { activeTab: ctx.activeTab },
    		$$inline: true
    	});

    	return {
    		c: function create() {
    			main = element("main");
    			header = element("header");
    			header.textContent = "SensQVis";
    			t1 = space();
    			nav = element("nav");
    			tabs.$$.fragment.c();
    			t2 = space();
    			article = element("article");
    			div = element("div");
    			button = element("button");
    			button.textContent = "change tabs";
    			t4 = space();
    			aside = element("aside");
    			aside.textContent = "AI Charts";
    			t6 = space();
    			footer = element("footer");
    			footer.textContent = "Footer";
    			header.className = "svelte-qqe0w4";
    			add_location(header, file$2, 67, 2, 1183);
    			nav.className = "svelte-qqe0w4";
    			add_location(nav, file$2, 68, 2, 1211);
    			button.className = "svelte-qqe0w4";
    			add_location(button, file$2, 73, 6, 1290);
    			div.id = "chart";
    			div.className = "svelte-qqe0w4";
    			add_location(div, file$2, 72, 4, 1267);
    			aside.className = "svelte-qqe0w4";
    			add_location(aside, file$2, 75, 4, 1352);
    			article.className = "svelte-qqe0w4";
    			add_location(article, file$2, 71, 2, 1253);
    			footer.className = "svelte-qqe0w4";
    			add_location(footer, file$2, 78, 2, 1393);
    			main.className = "svelte-qqe0w4";
    			add_location(main, file$2, 66, 0, 1174);
    			dispose = listen(button, "click", ctx.toggle);
    		},

    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},

    		m: function mount(target, anchor) {
    			insert(target, main, anchor);
    			append(main, header);
    			append(main, t1);
    			append(main, nav);
    			mount_component(tabs, nav, null);
    			append(main, t2);
    			append(main, article);
    			append(article, div);
    			append(div, button);
    			append(article, t4);
    			append(article, aside);
    			append(main, t6);
    			append(main, footer);
    			current = true;
    		},

    		p: function update(changed, ctx) {
    			var tabs_changes = {};
    			if (changed.activeTab) tabs_changes.activeTab = ctx.activeTab;
    			tabs.$set(tabs_changes);
    		},

    		i: function intro(local) {
    			if (current) return;
    			tabs.$$.fragment.i(local);

    			current = true;
    		},

    		o: function outro(local) {
    			tabs.$$.fragment.o(local);
    			current = false;
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(main);
    			}

    			tabs.$destroy();

    			dispose();
    		}
    	};
    }

    function instance$2($$self, $$props, $$invalidate) {
    	

      let activeTab = 0;
      function toggle() {
        $$invalidate('activeTab', activeTab = activeTab == 0 ? 1 : 0);
      }

    	return { activeTab, toggle };
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$2, create_fragment$2, safe_not_equal, []);
    	}
    }

    const app = new App({
    	target: document.body,
    	props: {
    		name: 'Leo'
    	}
    });

    return app;

}());
