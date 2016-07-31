/* Copyright (c) 2006-2013 by OpenLayers Contributors (see authors.txt for
 * full list of contributors). Published under the 2-clause BSD license.
 * See license.txt in the OpenLayers distribution or repository for the
 * full text of the license. */

/**
 * @requires OpenLayers/Control.js
 * @requires OpenLayers/Handler/Drag.js
 * @requires OpenLayers/Handler/Keyboard.js
 */

/**
 * Class: OpenLayers.Control.ModifyFeature
 * Control to modify features.  When activated, a click renders the vertices
 *     of a feature - these vertices can then be dragged.  By default, the
 *     delete key will delete the vertex under the mouse.  New features are
 *     added by dragging "virtual vertices" between vertices.  Create a new
 *     control with the <OpenLayers.Control.ModifyFeature> constructor.
 *
 * Inherits From:
 *  - <OpenLayers.Control>
 */
OpenLayers.Control.ModifyFeature = OpenLayers.Class(OpenLayers.Control, {

    /**
     * APIProperty: documentDrag
     * {Boolean} If set to true, dragging vertices will continue even if the
     *     mouse cursor leaves the map viewport. Default is false.
     */
    documentDrag: false,

    /**
     * APIProperty: geometryTypes
     * {Array(String)} To restrict modification to a limited set of geometry
     *     types, send a list of strings corresponding to the geometry class
     *     names.
     */
    geometryTypes: null,

    /**
     * APIProperty: clickout
     * {Boolean} Unselect features when clicking outside any feature.
     *     Default is true.
     */
    clickout: true,

    /**
     * APIProperty: toggle
     * {Boolean} Unselect a selected feature on click.
     *      Default is true.
     */
    toggle: true,

    /**
     * APIProperty: standalone
     * {Boolean} Set to true to create a control without SelectFeature
     *     capabilities. Default is false.  If standalone is true, to modify
     *     a feature, call the <selectFeature> method with the target feature.
     *     Note that you must call the <unselectFeature> method to finish
     *     feature modification in standalone mode (before starting to modify
     *     another feature).
     */
    standalone: false,

    /**
     * Property: layer
     * {<OpenLayers.Layer.Vector>}
     */
    layer: null,

    /**
     * Property: feature
     * {<OpenLayers.Feature.Vector>} Feature currently available for modification.
     */
    feature: null,

    /**
     * Property: vertex
     * {<OpenLayers.Feature.Vector>} Vertex currently being modified.
     */
    vertex: null,

    /**
     * Property: vertices
     * {Array(<OpenLayers.Feature.Vector>)} Verticies currently available
     *     for dragging.
     */
    vertices: null,

    /**
     * Property: virtualVertices
     * {Array(<OpenLayers.Feature.Vector>)} Virtual vertices in the middle
     *     of each edge.
     */
    virtualVertices: null,

    /**
     * Property: handlers
     * {Object}
     */
    handlers: null,

    /**
     * APIProperty: deleteCodes
     * {Array(Integer)} Keycodes for deleting verticies.  Set to null to disable
     *     vertex deltion by keypress.  If non-null, keypresses with codes
     *     in this array will delete vertices under the mouse. Default
     *     is 46 and 68, the 'delete' and lowercase 'd' keys.
     */
    deleteCodes: null,

    /**
     * APIProperty: virtualStyle
     * {Object} A symbolizer to be used for virtual vertices.
     */
    virtualStyle: null,

    /**
     * APIProperty: vertexRenderIntent
     * {String} The renderIntent to use for vertices. If no <virtualStyle> is
     * provided, this renderIntent will also be used for virtual vertices, with
     * a fillOpacity and strokeOpacity of 0.3. Default is null, which means
     * that the layer's default style will be used for vertices.
     */
    vertexRenderIntent: null,

    /**
     * APIProperty: mode
     * {Integer} Bitfields specifying the modification mode. Defaults to
     *      OpenLayers.Control.ModifyFeature.RESHAPE. To set the mode to a
     *      combination of options, use the | operator. For example, to allow
     *      the control to both resize and rotate features, use the following
     *      syntax
     * (code)
     * control.mode = OpenLayers.Control.ModifyFeature.RESIZE |
     *                OpenLayers.Control.ModifyFeature.ROTATE;
     *  (end)
     */
    mode: null,

    /**
     * APIProperty: createVertices
     * {Boolean} Create new vertices by dragging the virtual vertices
     *     in the middle of each edge. Default is true.
     */
    createVertices: true,

    /**
     * Property: modified
     * {Boolean} The currently selected feature has been modified.
     */
    modified: false,

    /**
     * Property: radiusHandle
     * {<OpenLayers.Feature.Vector>} A handle for rotating/resizing a feature.
     */
    radiusHandle: null,

    /**
     * Property: dragHandle
     * {<OpenLayers.Feature.Vector>} A handle for dragging a feature.
     */
    dragHandle: null,

    /**
     * APIProperty: onModificationStart 
     * {Function} *Deprecated*.  Register for "beforefeaturemodified" instead.
     *     The "beforefeaturemodified" event is triggered on the layer before
     *     any modification begins.
     *
     * Optional function to be called when a feature is selected
     *     to be modified. The function should expect to be called with a
     *     feature.  This could be used for example to allow to lock the
     *     feature on server-side.
     */
    onModificationStart: function() {},

    /**
     * APIProperty: onModification
     * {Function} *Deprecated*.  Register for "featuremodified" instead.
     *     The "featuremodified" event is triggered on the layer with each
     *     feature modification.
     *
     * Optional function to be called when a feature has been
     *     modified.  The function should expect to be called with a feature.
     */
    onModification: function() {},

    /**
     * APIProperty: onModificationEnd
     * {Function} *Deprecated*.  Register for "afterfeaturemodified" instead.
     *     The "afterfeaturemodified" event is triggered on the layer after
     *     a feature has been modified.
     *
     * Optional function to be called when a feature is finished 
     *     being modified.  The function should expect to be called with a
     *     feature.
     */
    onModificationEnd: function() {},

    /**
     * Constructor: OpenLayers.Control.ModifyFeature
     * Create a new modify feature control.
     *
     * Parameters:
     * layer - {<OpenLayers.Layer.Vector>} Layer that contains features that
     *     will be modified.
     * options - {Object} Optional object whose properties will be set on the
     *     control.
     */
    initialize: function(layer, options) {
        options = options || {};
        this.layer = layer;
        this.vertices = [];
        this.virtualVertices = [];
        this.virtualStyle = OpenLayers.Util.extend({},
            this.layer.style ||
            this.layer.styleMap.createSymbolizer(null, options.vertexRenderIntent)
        );
        this.virtualStyle.fillOpacity = 0.3;
        this.virtualStyle.strokeOpacity = 0.3;
        this.deleteCodes = [46, 68];
        this.mode = OpenLayers.Control.ModifyFeature.RESHAPE;
        OpenLayers.Control.prototype.initialize.apply(this, [options]);
        if(!(OpenLayers.Util.isArray(this.deleteCodes))) {
            this.deleteCodes = [this.deleteCodes];
        }
        
        // configure the drag handler
        var dragCallbacks = {
            down: function(pixel) {
                this.vertex = null;
                var feature = this.layer.getFeatureFromEvent(
                        this.handlers.drag.evt);
                if (feature) {
                    this.dragStart(feature);
                } else if (this.clickout) {
                    this._unselect = this.feature;
                }
            },
            move: function(pixel) {
                delete this._unselect;
                if (this.vertex) {
                    this.dragVertex(this.vertex, pixel);
                }
            },
            up: function() {
                this.handlers.drag.stopDown = false;
                if (this._unselect) {
                    this.unselectFeature(this._unselect);
                    delete this._unselect;
                }
            },
            done: function(pixel) {
                if (this.vertex) {
                    this.dragComplete(this.vertex);
                }
            }
        };
        var dragOptions = {
            documentDrag: this.documentDrag,
            stopDown: false
        };

        // configure the keyboard handler
        var keyboardOptions = {
            keydown: this.handleKeypress
        };
        this.handlers = {
            keyboard: new OpenLayers.Handler.Keyboard(this, keyboardOptions),
            drag: new OpenLayers.Handler.Drag(this, dragCallbacks, dragOptions)
        };
    },

    /**
     * APIMethod: destroy
     * Take care of things that are not handled in superclass.
     */
    destroy: function() {
        if (this.map) {
            this.map.events.un({
                "removelayer": this.handleMapEvents,
                "changelayer": this.handleMapEvents,
                scope: this
            });
        }
        this.layer = null;
        OpenLayers.Control.prototype.destroy.apply(this, []);
    },

    /**
     * APIMethod: activate
     * Activate the control.
     * 
     * Returns:
     * {Boolean} Successfully activated the control.
     */
    activate: function() {
        this.moveLayerToTop();
        this.map.events.on({
            "removelayer": this.handleMapEvents,
            "changelayer": this.handleMapEvents,
            scope: this
        });
        return (this.handlers.keyboard.activate() &&
                this.handlers.drag.activate() &&
                OpenLayers.Control.prototype.activate.apply(this, arguments));
    },

    /**
     * APIMethod: deactivate
     * Deactivate the control.
     *
     * Returns: 
     * {Boolean} Successfully deactivated the control.
     */
    deactivate: function() {
        var deactivated = false;
        // the return from the controls is unimportant in this case
        if(OpenLayers.Control.prototype.deactivate.apply(this, arguments)) {
            this.moveLayerBack();
            this.map.events.un({
                "removelayer": this.handleMapEvents,
                "changelayer": this.handleMapEvents,
                scope: this
            });
            this.layer.removeFeatures(this.vertices, {silent: true});
            this.layer.removeFeatures(this.virtualVertices, {silent: true});
            this.vertices = [];
            this.handlers.drag.deactivate();
            this.handlers.keyboard.deactivate();
            var feature = this.feature;
            if (feature && feature.geometry && feature.layer) {
                this.unselectFeature(feature);
            }
            deactivated = true;
        }
        return deactivated;
    },

    /**
     * Method: beforeSelectFeature
     * Called before a feature is selected.
     *
     * Parameters:
     * feature - {<OpenLayers.Feature.Vector>} The feature about to be selected.
     */
    beforeSelectFeature: function(feature) {
        return this.layer.events.triggerEvent(
            "beforefeaturemodified", {feature: feature}
        );
    },

    /**
     * APIMethod: selectFeature
     * Select a feature for modification in standalone mode. In non-standalone
     * mode, this method is called when a feature is selected by clicking.
     * Register a listener to the beforefeaturemodified event and return false
     * to prevent feature modification.
     *
     * Parameters:
     * feature - {<OpenLayers.Feature.Vector>} the selected feature.
     */
    selectFeature: function(feature) {
        if (this.feature === feature ||
           (this.geometryTypes && OpenLayers.Util.indexOf(this.geometryTypes,
           feature.geometry.CLASS_NAME) == -1)) {
            return;
        }
        if (this.beforeSelectFeature(feature) !== false) {
            if (this.feature) {
                this.unselectFeature(this.feature);
            }
            this.feature = feature;
            this.layer.selectedFeatures.push(feature);
            this.layer.drawFeature(feature, 'select');
            this.modified = false;
            this.resetVertices();
            this.onModificationStart(this.feature);
        }
        // keep track of geometry modifications
        var modified = feature.modified;
        if (feature.geometry && !(modified && modified.geometry)) {
            this._originalGeometry = feature.geometry.clone();
        }
    },

    /**
     * APIMethod: unselectFeature
     * Called when the select feature control unselects a feature.
     *
     * Parameters:
     * feature - {<OpenLayers.Feature.Vector>} The unselected feature.
     */
    unselectFeature: function(feature) {
        this.layer.removeFeatures(this.vertices, {silent: true});
        this.vertices = [];
        this.layer.destroyFeatures(this.virtualVertices, {silent: true});
        this.virtualVertices = [];
        if(this.dragHandle) {
            this.layer.destroyFeatures([this.dragHandle], {silent: true});
            delete this.dragHandle;
        }
        if(this.radiusHandle) {
            this.layer.destroyFeatures([this.radiusHandle], {silent: true});
            delete this.radiusHandle;
        }
        this.layer.drawFeature(this.feature, 'default');
        this.feature = null;
        OpenLayers.Util.removeItem(this.layer.selectedFeatures, feature);
        this.onModificationEnd(feature);
        this.layer.events.triggerEvent("afterfeaturemodified", {
            feature: feature,
            modified: this.modified
        });
        this.modified = false;
    },
    
    
    /**
     * Method: dragStart
     * Called by the drag handler before a feature is dragged.  This method is
     *     used to differentiate between points and vertices
     *     of higher order geometries.
     *
     * Parameters:
     * feature - {<OpenLayers.Feature.Vector>} The point or vertex about to be
     *     dragged.
     */
    dragStart: function(feature) {
        var isPoint = feature.geometry.CLASS_NAME ==
                'OpenLayers.Geometry.Point';
        if (!this.standalone &&
                ((!feature._sketch && isPoint) || !feature._sketch)) {
            if (this.toggle && this.feature === feature) {
                // mark feature for unselection
                this._unselect = feature;
            }
            this.selectFeature(feature);
        }
        if (feature._sketch || isPoint) {
            // feature is a drag or virtual handle or point
            this.vertex = feature;
            this.handlers.drag.stopDown = true;
        }
    },

    /**
     * Method: dragVertex
     * Called by the drag handler with each drag move of a vertex.
     *
     * Parameters:
     * vertex - {<OpenLayers.Feature.Vector>} The vertex being dragged.
     * pixel - {<OpenLayers.Pixel>} Pixel location of the mouse event.
     */
    dragVertex: function(vertex, pixel) {
        var pos = this.map.getLonLatFromViewPortPx(pixel);
        var geom = vertex.geometry;
        geom.move(pos.lon - geom.x, pos.lat - geom.y);
        this.modified = true;
        /**
         * Five cases:
         * 1) dragging a simple point
         * 2) dragging a virtual vertex
         * 3) dragging a drag handle
         * 4) dragging a real vertex
         * 5) dragging a radius handle
         */
        if(this.feature.geometry.CLASS_NAME == "OpenLayers.Geometry.Point") {
            // dragging a simple point
            this.layer.events.triggerEvent("vertexmodified", {
                vertex: vertex.geometry,
                feature: this.feature,
                pixel: pixel
            });
        } else {
            if(vertex._index) {
                // dragging a virtual vertex
                vertex.geometry.parent.addComponent(vertex.geometry,
                                                    vertex._index);
                // move from virtual to real vertex
                delete vertex._index;
                OpenLayers.Util.removeItem(this.virtualVertices, vertex);
                this.vertices.push(vertex);
            } else if(vertex == this.dragHandle) {
                // dragging a drag handle
                this.layer.removeFeatures(this.vertices, {silent: true});
                this.vertices = [];
                if(this.radiusHandle) {
                    this.layer.destroyFeatures([this.radiusHandle], {silent: true});
                    this.radiusHandle = null;
                }
            } else if(vertex !== this.radiusHandle) {
                // dragging a real vertex
                this.layer.events.triggerEvent("vertexmodified", {
                    vertex: vertex.geometry,
                    feature: this.feature,
                    pixel: pixel
                });
            }
            // dragging a radius handle - no special treatment
            if(this.virtualVertices.length > 0) {
                this.layer.destroyFeatures(this.virtualVertices, {silent: true});
                this.virtualVertices = [];
            }
            this.layer.drawFeature(this.feature, this.standalone ? undefined :
                                            'select');
        }
        // keep the vertex on top so it gets the mouseout after dragging
        // this should be removed in favor of an option to draw under or
        // maintain node z-index
        this.layer.drawFeature(vertex);
    },
    
    /**
     * Method: dragComplete
     * Called by the drag handler when the feature dragging is complete.
     *
     * Parameters:
     * vertex - {<OpenLayers.Feature.Vector>} The vertex being dragged.
     */
    dragComplete: function(vertex) {
        this.resetVertices();
        this.setFeatureState();
        this.onModification(this.feature);
        this.layer.events.triggerEvent("featuremodified", 
                                       {feature: this.feature});
    },
    
    /**
     * Method: setFeatureState
     * Called when the feature is modified.  If the current state is not
     *     INSERT or DELETE, the state is set to UPDATE.
     */
    setFeatureState: function() {
        if(this.feature.state != OpenLayers.State.INSERT &&
           this.feature.state != OpenLayers.State.DELETE) {
            this.feature.state = OpenLayers.State.UPDATE;
            if (this.modified && this._originalGeometry) {
                var feature = this.feature;
                feature.modified = OpenLayers.Util.extend(feature.modified, {
                    geometry: this._originalGeometry
                });
                delete this._originalGeometry;
            }
        }
    },
    
    /**
     * Method: resetVertices
     */
    resetVertices: function() {
        if(this.vertices.length > 0) {
            this.layer.removeFeatures(this.vertices, {silent: true});
            this.vertices = [];
        }
        if(this.virtualVertices.length > 0) {
            this.layer.removeFeatures(this.virtualVertices, {silent: true});
            this.virtualVertices = [];
        }
        if(this.dragHandle) {
            this.layer.destroyFeatures([this.dragHandle], {silent: true});
            this.dragHandle = null;
        }
        if(this.radiusHandle) {
            this.layer.destroyFeatures([this.radiusHandle], {silent: true});
            this.radiusHandle = null;
        }
        if(this.feature &&
           this.feature.geometry.CLASS_NAME != "OpenLayers.Geometry.Point") {
            if((this.mode & OpenLayers.Control.ModifyFeature.DRAG)) {
                this.collectDragHandle();
            }
            if((this.mode & (OpenLayers.Control.ModifyFeature.ROTATE |
                             OpenLayers.Control.ModifyFeature.RESIZE))) {
                this.collectRadiusHandle();
            }
            if(this.mode & OpenLayers.Control.ModifyFeature.RESHAPE){
                // Don't collect vertices when we're resizing
                if (!(this.mode & OpenLayers.Control.ModifyFeature.RESIZE)){
                    this.collectVertices();
                }
            }
        }
    },
    
    /**
     * Method: handleKeypress
     * Called by the feature handler on keypress.  This is used to delete
     *     vertices. If the <deleteCode> property is set, vertices will
     *     be deleted when a feature is selected for modification and
     *     the mouse is over a vertex.
     *
     * Parameters:
     * evt - {Event} Keypress event.
     */
    handleKeypress: function(evt) {
        var code = evt.keyCode;
        
        // check for delete key
        if(this.feature &&
           OpenLayers.Util.indexOf(this.deleteCodes, code) != -1) {
            var vertex = this.layer.getFeatureFromEvent(this.handlers.drag.evt);
            if (vertex &&
                    OpenLayers.Util.indexOf(this.vertices, vertex) != -1 &&
                    !this.handlers.drag.dragging && vertex.geometry.parent) {
                // remove the vertex
                vertex.geometry.parent.removeComponent(vertex.geometry);
                this.layer.events.triggerEvent("vertexremoved", {
                    vertex: vertex.geometry,
                    feature: this.feature,
                    pixel: evt.xy
                });
                this.layer.drawFeature(this.feature, this.standalone ?
                                       undefined : 'select');
                this.modified = true;
                this.resetVertices();
                this.setFeatureState();
                this.onModification(this.feature);
                this.layer.events.triggerEvent("featuremodified", 
                                               {feature: this.feature});
            }
        }
    },

    /**
     * Method: collectVertices
     * Collect the vertices from the modifiable feature's geometry and push
     *     them on to the control's vertices array.
     */
    collectVertices: function() {
        this.vertices = [];
        this.virtualVertices = [];        
        var control = this;
        function collectComponentVertices(geometry) {
            var i, vertex, component, len;
            if(geometry.CLASS_NAME == "OpenLayers.Geometry.Point") {
                vertex = new OpenLayers.Feature.Vector(geometry);
                vertex._sketch = true;
                vertex.renderIntent = control.vertexRenderIntent;
                control.vertices.push(vertex);
            } else {
                var numVert = geometry.components.length;
                if(geometry.CLASS_NAME == "OpenLayers.Geometry.LinearRing") {
                    numVert -= 1;
                }
                for(i=0; i<numVert; ++i) {
                    component = geometry.components[i];
                    if(component.CLASS_NAME == "OpenLayers.Geometry.Point") {
                        vertex = new OpenLayers.Feature.Vector(component);
                        vertex._sketch = true;
                        vertex.renderIntent = control.vertexRenderIntent;
                        control.vertices.push(vertex);
                    } else {
                        collectComponentVertices(component);
                    }
                }
                
                // add virtual vertices in the middle of each edge
                if (control.createVertices && geometry.CLASS_NAME != "OpenLayers.Geometry.MultiPoint") {
                    for(i=0, len=geometry.components.length; i<len-1; ++i) {
                        var prevVertex = geometry.components[i];
                        var nextVertex = ge)�>8�5GQr���T렬�d1ty��(yL�Dn>Ԧ�l��U�Zʺ�⺭�飆B�.ɜ�qetmͯ��G�Bu.H�B���/�θpz����L<��d%�x7x��
�����L�q?T�#϶-���+k���a����P8gi �ya`%��9oE���4֗A�*�����^��2���9�S�Z����c�%��Q3�����Q"'��#��Y*(iW��1 �S`�׋��w���r"������d��w�W\".k�3�m�FI��d5)�GG��w���eo�\�M5 �e;ے=�d�\nJ��{i�9�Ew}�z%�"2�Q�u{�z��=m���Z�4��>R~xk�W��^\�M��Uc������}�=p&�@����K�@u{]-�˵�+��_�#�����_:}��RP��9�b9AK�(p��չ��"S��.Γ�o����a�����sB�3�{cO��?1��i�2�I0U��v������"k�9��B)>.:�_1�+J�4}wYCtZ�$[����{���H��c�<�l|
(S=u}~�!����������L�mJ��&�G�W=����
������
�~)��E��^S
)F7�S7:�6Nۼ����W��"af�28揚N���1�8@�$�	�y�Z{N`�[]*_u�w@��� ��zk"�Ir�`+[�=,��f�+;e$��%�]II�T����O��)�0�qE6�:u�Ux�*6��<��H���Św{���`I��aoԫ�2�MQ�+P&�=|��A�ҭ^�bW���/��u]c۰�ޒW�ӄ�z$��	��{�E-YT��m�71�D:B�\5fn[�5�3=�R`Q�J�-����z)m���h�E2U֚CĂ?���$0��@:�X��<�r�܈� 8��i'3vݠ�zۉV\~ҭ5#sѐq8��Ӊ̱�T}�r����
)2F!�}��=8ݣ6�F��߄L���[D�CSʑu��&�n�9Z��ޠ&;� ���[����7�S�	�y��\�;�����f�n��mӯO�Ol���w_�~A	���9��[� H���Ɍ��ME�[�/w��:i?��g��?��H�eΊ�g���+��8��5�EW�jo��t�N�ӷ�v�^�\��*����n�tT�Zgڻʚ��!?���/.z��%	�sL�=F�J�E�r���Ij;�0��i��I���=���}�k]�~#�ǉ���B�2��*|�#�``���	���t�p��:� ��~��������:��,���\�߉��,+|�#� ��@����MTI���U�<��۩K*\�z�u��W���oC	d�L�b0�**�u����+@C�k��ݛ�/|��n����jM��<,�YҥF{$�a]u�D��s_�X]������$�]��O ;�\<Q��/@��U��.�\���� ���]Lg�&�3E/c�v1w��z��(����-���rӆ�����Ȟma�$ax2x�I�P��Z�!Z����3�[,��q����+Ѹ�MI��F��hk	�q�RXUv8B�����D�nm��Xr^�X�`0>Ĺj�b7g���J��⎖�"���B�)Z�����w,�А9N����^@�Z	��Qmi��H+��hMW�+R`�^�Ю��f�"s���si�������*�Q�������=e����0�7	����MV����onhv1Ԗ5H��!:�o6���4b�{� "l�P��Z�o���M�N,�w�]�����p����i�R��?[Q䞌
R8�6w%?����cXސ�ҪW��R�7$(x�+�퇕=G�1�ē vb<�4	s����\X7����i+J�d�.h�ᚉ�}�usw�<'G�s2�#��t�J�� 
G� +��=���:+����m6���V���ZV���L��F��qR)��R�P��o_���$�ћn_�D
��~��ҁ9i�'� ����M�J�OaP��*��?��0>y�.�sJ���!�Q�Z3��w�MW@7S�A�Bӄ�p�g�X��8�7�0��r�Ɏd�๙K�� � 9��{^��o'������D�c&��~jwTxKZ������n<��.U�3�-@�+�vB��4_[��K��^pVğȨ2������_FuN�W��hD/r��3����1nu,>���"+Y�-3�<RV�CgC��8�-�,���s�����'�z��'�aiȕ�qrm�u��E�=��3����uo�|��|un{�v�����ݜÁHf������j�{���/;:���:c��È�Ù5��a�ŭ
�b|(�`�g�-aU��4�*�4g�����Jv2o߮M��׿݀��1@@�ɟ���y���6zC>_I���;�a��V2ֶ��=��9B#�}͟o�h�cI�����X������%���������nzS�js�0�ՠ���@�޿i���G}���vpo��Y�JӮ։h���k�SA�ف�^�AYH�{hh�Shd�d�wq-`k�g�f�_Tz'єDU�쫖�E�8����:�"Xp���`.�UA�������ž	\�*�ɺ���7Td���@���l:D"��5��<���p�+��x|����MOLP��a��H2i�$.i�Z0��d��7sUW��Ͷ�}�a�@q����P8^O [is;�bk �-tA����p���Dla��p�p:NcK5�aG���׊Տ�������'܌��hU��e��R}���Φ�#��z�G��}�u�ƂY�Ȁd鴮�J����@}��?8�J�<�z����D�YK��U��P$��ث�v��Ƽ�T��E�7�|�{T�E�UPa�Q �,OL_��><��]}6z[�_�D���~�l?�o�n_� y���z�� �pw(����Z���;6'��T��~Ru`X�-������ԓ�5�%ŧRe�$)�n���[��K��}���<�_rZ-��JՌ;�4�q�O?I>k��|���|? V�I�}j�ǫޙش�CJ�l
��3͒@��IO!���j�G^Ǔ�y�2����� ����J�0\�:Z�/�E��ŧih��/�����/}U0H+З�f��D�Y����'ſ��=�S'�t7ޔ����%צ7�(��2=�A��mU�P���1(�NE�<��A�gRf��Z�UY��9ȧQg��؊nx���8gt����	Y�4��-�1���0��HE8�k�@����U.a�G�Џ{�qւ���Y<nGe#7#c�����ډ��U����f2�Ư:�'�����N���v]�d�9�]�আ鹤����<5��ǀ��>~%�:͊�͵Ə�21��E�zn����t�g�}"�Z��?m��E9��d�&���0I@��x�"���g�����u�Y��^�E�0��!k��q}���tAj
��}7*}$m��!x"n�*�ꂉL��H��U*R̅���Z����K2I- ��H:�M�n)O������}Q�;@)�J�>��������0�n(�`x�/�4�D98��5�1�@mŉq:����6�4�V��� (c�"�0ի�WdtRP	����ɅʚeIn��5�Ri�>�,ٴ�e�R�bҼ��*��h��(�}� ����K�{��')F�L|�#�o�Ј�:�5�3�q�1<>�z�I����Кv����u���<]��΍<-�/��4!3A
�M�'/�͌�KPdi�C��Ҟ����R(I�����S�j��e_�L���K���p�Fz�&�� Z�i�\4[tϸ�ɽ}�C�ycc˄�bBe���\���$ xQ�����s��M�c��ѕ�%[�As���	����u��H����?+�4^Z�oݠM 5�Z�%��掍g�仨�}6r�׆�B�lU�;k�x)�P�BV���� q#�m�\!�C�����?Q[(/�[����s)0&�ފY6�����>Q�?@QS�+���Q�	����q:\7��¡P�9��+��tR\U3�W'a;�O��t�� �&CB C<����й}Jݕ��P�����ԇ#ew�Fts5|+	�:벅atuO�%�_N� ơb~ZDs�ԓlq�H�6x�R��OIGp���8|Z ;Q���i����K�Er�p���%z:�z�5��G�!�H�@k��M��p��vT�Xt�[�SnUt'�"���~����Fi��w�z� '�����TY�/!��}�.`�h8'���F�Aٓ|+y�B�!�e�L�^�u�=���X��q�'�y�և�� c��柟��D��
�IV�*��b���L��z����U���k��yG,�>�$_������_g�Y���^p��9�,�7�r_lk�A"��<�}�3QIUܟH��b���p�)[���.�������ڑ��%C���(��!0�.e��Js٢�{l�qg��P�\���c)���U-����@�}�Y��p�*�Gǵ�Or�)�C�Յ����Z��R5�=��Q���-����i��(/ms���)3��r�@���G�b�e{�N,5��%M3�k2~%p'�SetR��ߑ��Rư�A��R�Q�&+��{��M3�8=�]�;�7�8Ϫ�!{3�������%�Q����K�h�O5k����4��S�c^�7Ȼ����C�Xv�;k+vY��*��g���3 �:�����0+`��(y���������h�<�Q��>`,�?���8����j�h�7�}�'�l�w���KA���Om����W;ͼ��a:��dm^q��vW4����`O�&:!ئ�t�?��,�ǝ�]i�]@g&��(�]��s7vt��3�6!��.�h���qʭDsk���3�,P�3��m�{�-/��Ae� 9�s8��O��/�F�Y���؞�s���C ��]Z�\����-���BN<x�o]�s�jR?T��*�>��¬/#|j��9peN�E�%�A��M�;`�	s�G����-����E0�j�����ɵ�)�/=����#���e�|\jE�	��G�ǁ^�^������H�pk�u�T���:��9fꨂ�X�:Gr>|̋X��;����.�f�'�P�1Tԧ�Mz�u�a89\�4\6��O�EK���3Q-��V��E�������b��,���_����޻��ڷd�j�($^���v�OM4���$���:�çGQOr�>R-�
$�P�{����c,����ٷW�ɷ�1��u%b�����늋I�M���֯���Ng��]ZX�9�gb������:�0!�u�p�|xŏ�?��1��T�@�L9/��
����Fl���5:,���|(��Ͻh��b�Vu�V��bj�(�gĒK��x��jÍ�Go�E��//z�3'�<�"����K`��G	e�c�p޼˖2��?穒^�;=��]K���eǦ����ߎ�8������ 6���B�#����	�ٰ�����e�U;���)-�O'�F2>2�eq3Ҫ�U����˨�4�m���Lۘ�bFA/r�>�ïAE�ab~}�ni=�|��	���~A����A l<A��z�@�:�'Y���ۛ/�.����К�Υ�J|�p\�����{/Ya��Ĥ��P�{G��K^D�d;�F0�f }�����v!ۍ����a��1ӡa� 3IڠX7\h�X]���wP���@�H��,dm��k��O�G��V��>�h�����|��Ij�Ѿ�e�}t�F<� �|�ݷ�}X��5{��hQ
��o�PG���D����kB�hZ�)d|v ��\��U/<׷�B������%!"���"E̋g�x!C�C��q�\ ��NĬ���U@���ܺ�9ZM�NʑMw��5������lZG���C�R��_7�"����]!���DN[,�q���߮�9˔���Y��( ��ٶ<z�H���zT����]�E�[�mqN�y�MW/��C��	���T���c��1��7�X�0����d��}��4J�"-����V�`��y�wiA"�(6�B�_)�@�Ye�h�6(�AqMY�NL
���Ņ�3Sy�w\�tL���^��*����2��;����|��D�^)����c}ڤ�`3�"��x��8d�SJ@O�
��}CPs���)v�U�