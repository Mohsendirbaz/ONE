# Rhino script equivalent to TNTC.scr
# This would be saved as a .py file to be run in Rhino Python

import rhinoscriptsyntax as rs
import scriptcontext as sc
import Rhino

def main():
    # Set units to mm
    rs.UnitSystem(2)

    # Create layers with colors
    rs.AddLayer("OUTLINE", [255, 255, 255])
    rs.AddLayer("BUTTONS", [255, 0, 0])
    rs.AddLayer("TOUCHPAD", [0, 255, 0])
    rs.AddLayer("DISPLAY", [0, 255, 255])
    rs.AddLayer("DIMRING", [0, 0, 255])
    rs.AddLayer("HOUSING", [255, 0, 255])
    rs.AddLayer("TEXT", [255, 255, 255])
    rs.AddLayer("DIMS", [255, 255, 0])
    rs.AddLayer("HIDDEN", [128, 128, 128])

    # Set current layer to OUTLINE
    rs.CurrentLayer("OUTLINE")

    # Draw outline rectangle
    outline_rect = rs.AddRectangle([0, 0, 0], 140, 140)

    # Set current layer to TEXT
    rs.CurrentLayer("TEXT")

    # Add "TOP VIEW" text
    top_view_text = rs.AddText("TOP VIEW", [70, 155, 0], 5)

    # Set current layer to DISPLAY
    rs.CurrentLayer("DISPLAY")

    # Draw display rectangle
    display_rect = rs.AddRectangle([35, 110, 0], 70, 15)

    # Set current layer to DIMRING
    rs.CurrentLayer("DIMRING")

    # Draw dimension rings
    outer_ring = rs.AddCircle([70, 70, 0], 40)
    inner_ring = rs.AddCircle([70, 70, 0], 30)

    # Set current layer to TOUCHPAD
    rs.CurrentLayer("TOUCHPAD")

    # Draw touchpad circles
    touchpad_main = rs.AddCircle([70, 70, 0], 25)
    touchpad_center = rs.AddCircle([70, 70, 0], 3)
    touchpad_top = rs.AddCircle([70, 85, 0], 3)
    touchpad_right = rs.AddCircle([85, 70, 0], 3)
    touchpad_bottom = rs.AddCircle([70, 55, 0], 3)
    touchpad_left = rs.AddCircle([55, 70, 0], 3)

    # Set current layer to BUTTONS
    rs.CurrentLayer("BUTTONS")

    # Draw buttons
    button_left = rs.AddCircle([35, 25, 0], 7)
    button_right = rs.AddCircle([105, 25, 0], 7)

    # Set current layer to TEXT
    rs.CurrentLayer("TEXT")

    # Add more text
    rs.AddText("Selection Button", [35, 15, 0], 3)
    rs.AddText("Mode Toggle Button", [105, 15, 0], 3)
    rs.AddText("Status Display", [70, 117, 0], 3)
    rs.AddText("Dimension Ring", [70, 95, 0], 3)
    rs.AddText("5-Point", [70, 70, 0], 3)
    rs.AddText("TouchPad", [70, 65, 0], 3)

    # Set current layer to OUTLINE
    rs.CurrentLayer("OUTLINE")

    # Draw side view outline rectangle
    side_outline_rect = rs.AddRectangle([200, 0, 0], 140, 140)

    # Set current layer to TEXT
    rs.CurrentLayer("TEXT")

    # Add "SIDE VIEW" text
    side_view_text = rs.AddText("SIDE VIEW", [270, 155, 0], 5)

    # Set current layer to HOUSING
    rs.CurrentLayer("HOUSING")

    # Draw housing rectangles
    housing_rect1 = rs.AddRectangle([280, 40, 0], 40, 30)
    housing_rect2 = rs.AddRectangle([270, 70, 0], 60, 30)

    # Draw thumb strap lines
    line1 = rs.AddLine([280, 100, 0], [280, 110, 0])
    line2 = rs.AddLine([280, 110, 0], [320, 110, 0])
    line3 = rs.AddLine([320, 110, 0], [320, 100, 0])
    line4 = rs.AddLine([280, 95, 0], [270, 85, 0])
    line5 = rs.AddLine([270, 85, 0], [270, 70, 0])
    line6 = rs.AddLine([320, 95, 0], [330, 85, 0])
    line7 = rs.AddLine([330, 85, 0], [330, 70, 0])

    # Set current layer to TEXT
    rs.CurrentLayer("TEXT")

    # Add text for side view
    rs.AddText("Housing", [300, 55, 0], 3)
    rs.AddText("Thumb Strap", [325, 105, 0], 3)

    # Set current layer to BUTTONS
    rs.CurrentLayer("BUTTONS")

    # Draw side view buttons
    side_button1 = rs.AddCircle([290, 85, 0], 3)
    side_button2 = rs.AddCircle([310, 85, 0], 3)

    # Set current layer to DIMS
    rs.CurrentLayer("DIMS")

    # Add dimensions
    dim1 = rs.AddLinearDimension([0, -15, 0], [0, 0, 0], [140, 0, 0])
    dim2 = rs.AddLinearDimension([-15, 70, 0], [0, 0, 0], [0, 140, 0])
    dim3 = rs.AddLinearDimension([270, -15, 0], [200, 0, 0], [340, 0, 0])
    dim4 = rs.AddLinearDimension([185, 70, 0], [200, 0, 0], [200, 140, 0])
    dim5 = rs.AddLinearDimension([300, 35, 0], [280, 40, 0], [320, 40, 0])
    dim6 = rs.AddLinearDimension([275, 55, 0], [280, 40, 0], [280, 70, 0])
    dim7 = rs.AddLinearDimension([300, 75, 0], [270, 70, 0], [330, 70, 0])
    dim8 = rs.AddLinearDimension([265, 85, 0], [270, 70, 0], [270, 100, 0])

    # Zoom to extents
    rs.ZoomExtents()

    # Save the document
    rs.Command("_-SaveAs C:\\Temp\\TNTC.3dm")

if __name__ == "__main__":
    main()