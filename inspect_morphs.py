from pygltflib import GLTF2
import sys

def main(filepath):
    gltf = GLTF2.load(filepath)
    for i, mesh in enumerate(gltf.meshes):
        print(f"Mesh {i}: {mesh.name}")
        for j, primitive in enumerate(mesh.primitives):
            if primitive.targets:
                print(f"  Primitive {j} has {len(primitive.targets)} morph targets")
                # Try to find names in extras or elsewhere
                if mesh.extras and "targetNames" in mesh.extras:
                    print(f"    Target Names: {mesh.extras['targetNames']}")
                elif primitive.extras and "targetNames" in primitive.extras:
                    print(f"    Target Names: {primitive.extras['targetNames']}")

if __name__ == "__main__":
    main(sys.argv[1])
