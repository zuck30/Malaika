import struct
import json
import sys

def inspect_glb(filepath):
    with open(filepath, 'rb') as f:
        # Read header
        magic = f.read(4)
        if magic != b'glTF':
            print("Not a GLB file")
            return

        version = struct.unpack('<I', f.read(4))[0]
        length = struct.unpack('<I', f.read(4))[0]

        # Read Chunk 0 (JSON)
        chunk_length = struct.unpack('<I', f.read(4))[0]
        chunk_type = f.read(4)
        if chunk_type != b'JSON':
            print("First chunk is not JSON")
            return

        json_data = f.read(chunk_length).decode('utf-8')
        data = json.loads(json_data)

        print(f"GLB Version: {version}")

        if 'meshes' in data:
            for i, mesh in enumerate(data['meshes']):
                print(f"Mesh {i}: {mesh.get('name', 'unnamed')}")
                if 'primitives' in mesh:
                    for p_idx, prim in enumerate(mesh['primitives']):
                        if 'extras' in prim and 'targetNames' in prim['extras']:
                            print(f"  Primitive {p_idx} Target Names: {prim['extras']['targetNames']}")
                        elif 'targets' in prim:
                            print(f"  Primitive {p_idx} has {len(prim['targets'])} morph targets")

        if 'animations' in data:
            print("Animations:")
            for i, anim in enumerate(data['animations']):
                print(f"  {i}: {anim.get('name', 'unnamed')}")

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python inspect_glb.py <path_to_glb>")
    else:
        inspect_glb(sys.argv[1])
