(function () {
  'use strict';
  var newText;
  var hasFocus = false;
  var isDown = false;
  var origX, origY;

  var Text = Darkroom.Transformation.extend({
    applyTransformation: function (canvas, image, next) {
      var snapshot = new Image();
      snapshot.onload = function () {
        // Validate image
        if (this.height < 1 || this.width < 1)
          return;

        var imgInstance = new fabric.Image(this, {
          // options to make the image static
          selectable: false,
          evented: false,
          lockMovementX: true,
          lockMovementY: true,
          lockRotation: true,
          lockScalingX: true,
          lockScalingY: true,
          lockUniScaling: true,
          hasControls: false,
          hasBorders: false
        });

        var width = this.width;
        var height = this.height;

        // Add image
        canvas.add(imgInstance);

        next(imgInstance);
      };

      var viewport = Darkroom.Utils.computeImageViewPort(image);
      var width = viewport.width;
      var height = viewport.height;

      canvas.add(this.options.text);
      canvas.renderAll();
      snapshot.src = canvas.toDataURL();
    }
  });

  Darkroom.plugins['text'] = Darkroom.Plugin.extend({
    defaults: {
      text: 'Sample Text...'
    },

    initialize: function InitDarkroomTextPlugin() {
      var buttonGroup = this.darkroom.toolbar.createButtonGroup();

      this.textButton = buttonGroup.createButton({
        image: 'text',
        title: 'Add Text'
      });
      this.okButton = buttonGroup.createButton({
        image: 'done',
        type: 'success',
        hide: true
      });
      this.cancelButton = buttonGroup.createButton({
        image: 'close',
        type: 'danger',
        hide: true
      });

      this.textButton.addEventListener('click', this.addText.bind(this));
      this.okButton.addEventListener('click', this.saveText.bind(this));
      this.cancelButton.addEventListener('click', this.releaseFocus.bind(this));
      this.darkroom.canvas.on('mouse:down', this.onMouseDown.bind(this));
      this.darkroom.canvas.on('mouse:move', this.onMouseMove.bind(this));
      this.darkroom.canvas.on('mouse:up', this.handleMouseUp.bind(this));

      this.darkroom.addEventListener('core:transformation', this.releaseFocus.bind(this));
    },

    clear: function () {
      this.textButton.active(false);
      this.darkroom.dispatchEvent('text:end');
      this.textButton.active(false);
      this.okButton.hide(true);
      this.cancelButton.hide(true);
      if (this.newText) {
        this.newText.remove();
      }
      hasFocus = false;
    },

    hasFocus: function () {
      return;
    },

    addText: function (options) {
      if (hasFocus) {
        this.releaseFocus();
        return;
      }
      hasFocus = true;
        this.darkroom.clearFocus('text');

        this.textButton.active(true);
        this.okButton.hide(false);
        this.cancelButton.hide(false);

        var factor = this.darkroom.image.scaleX;
        var text = new fabric.IText(this.options.text, {
          left: 100 * factor,
          top: 100 * factor,
          fill: "black",
          fontFamily: 'Monospace',
          fontSize: 25,
          lockSkewingX: true,
          lockSkewingY: true,
          scaleX: factor,
          scaleY: factor,
          padding: 10
        });

        text.on(
          this.image = this.darkroom.image, {
            scaling: function (e) {
              this.factor = this.image.scaleX;

              var obj = this,
                w = obj.width * obj.scaleX / factor,
                h = obj.height * obj.scaleY / factor;

              obj.set({
                width: w,
                height: h,
                scaleX: factor,
                scaleY: factor
              });
            }
          });

        this.darkroom.canvas.add(text);
        this.newText = text;
    },

    saveText: function () {
      var canvas = this.darkroom.canvas;
      this.okButton.hide(true);
      this.cancelButton.hide(true);
      this.textButton.active(false);
      this.newText.hasBorders = false;
      this.newText.hasControls = false;
      this.newText.hasRotatingPoint = false;
      this.newText.selectionColor = "transparent";
      this.newText.abortCursorAnimation();
      var canvasOffset = canvas.calcOffset();
      this.newText.left -= this.darkroom.options.left;
      this.newText.top -= this.darkroom.options.top;
      this.darkroom.applyTransformation(new Text({
        text: this.newText
      }));
    },
    
    onMouseDown: function(){
      if(!this.newText){return;}
      if(this.newText.active){
      var canvas = this.darkroom.canvas;
      this.isDown = true;
      var pointer = canvas.getPointer(event.e);
      origX = pointer.x;
      origY = pointer.y;
      }
    },
    
    onMouseMove: function(){
      if(!this.isDown){
        return;
      }
      var canvas = this.darkroom.canvas;
      var pointer = canvas.getPointer(event.e);

      if (origX > pointer.x) {
        this.newText.set({
          left: Math.abs(pointer.x)
        });
      }
      if (origY > pointer.y) {
        this.newText.set({
          top: Math.abs(pointer.y)
        });
      }

      canvas.renderAll();
    },
    
    handleMouseUp: function(){
      this.isDown = false;
    },

    releaseFocus: function () {
      if(this.newText){this.newText.remove();}

      this.textButton.active(false);
      this.okButton.hide(true);
      this.cancelButton.hide(true);
      hasFocus = false;
    }
  });
})();