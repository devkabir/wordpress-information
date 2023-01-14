const wp_meta = document.getElementById('wp-meta');
const wp_plugin = document.getElementById('wp-plugin');
const wp_theme = document.getElementById('wp-theme');
const wp_library = document.getElementById('wp-library');

chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {

    const generate_html = (node, collection) => {
        if (Object.entries(collection).length > 0) {
            node.innerHTML = ''
            for (const [key, value] of Object.entries(collection)) {
                let name = key;
                if (typeof value === 'object') {
                    name = get_name(value);
                }
                let anchorDom = document.createElement('li')
                anchorDom.setAttribute('class', 'list-group-item  d-flex justify-content-between align-items-center')
                anchorDom.innerHTML = name
                node.append(anchorDom)
            }
        } else {
            node.innerHTML = 'N/A'
        }
    };


    const get_name = value => {
        let name = makeTitleForSlug(value.name)
        if (value.version && value.version.length < 10) {
            name += ' <strong>' + value.version + '</strong>'
        }
        return name
    };

    const makeTitleForSlug = str => str.replace(/[^a-z0-9]+/gi, '-').toLowerCase().split('-').map(i => i.charAt(0).toUpperCase() + i.slice(1)).join(' ');

    wp_meta.innerHTML = wp_plugin.innerHTML = wp_theme.innerHTML = 'Loading..';
    generate_html(wp_meta, request.metas)
    generate_html(wp_plugin, request.plugins)
    generate_html(wp_theme, request.themes);
    generate_html(wp_library, request.library);

});

document.addEventListener('DOMContentLoaded', async function () {


    const helloWordPress = () => {
        let data = {
                metas: {},
                plugins: {},
                themes: {},
                library:{}
            }, metas = document.querySelectorAll("meta[name='generator']"),
            nodes = document.querySelectorAll('link[href], script[src]');
        const get_data = (node, data, type) => {
            if (node !== null) {
                let regex = type === 'plugins' ? /\/plugins\/([a-z0-9-_]+)\/.*?ver=([0-9.]+)/i : /\/themes\/([a-z0-9-_]+)\/.*?ver=([0-9.]+)/i
                let libRgx = /\/([a-z-_]+)\.min\.*/i
                let theme_plug_match ,lib_match;
                if (node.href !== undefined) {
                    lib_match = node.href.match(libRgx);
                    theme_plug_match = node.href.match(regex);
                }
                if (node.src !== undefined) {
                    lib_match = node.src.match(libRgx);
                    theme_plug_match = node.src.match(regex);
                }
                if (theme_plug_match !== null) {
                    data[type][theme_plug_match[1]] = {name: theme_plug_match[1], version: theme_plug_match[2]}
                }
                if (lib_match !== null) {
                    data['library'][lib_match[1]] = {name: lib_match[1]}
                }
            }
        };


        nodes.forEach(node => {
            get_data(node, data, 'plugins');
            get_data(node, data, 'themes');
        })
        metas.forEach(meta => data.metas[meta.content] = meta.content)
        chrome.runtime.sendMessage(data);
    };

    const [tab] = await chrome.tabs.query({
        active: true,
        currentWindow: true
    })

    await chrome.scripting.executeScript({
        target: {tabId: tab.id},
        func: helloWordPress,
    });


}, false);
