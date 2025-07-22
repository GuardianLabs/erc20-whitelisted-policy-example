//SPDX-License-Identifier: Unlicensed
pragma solidity ^0.8.29;

library IterableMapping {
    struct AddressSet {
        address[] values;
        mapping(address => uint256) indices; // 1-based index, 0 means not present
    }

    /**
     * @dev Add addresses to the set
     * @param set The AddressSet to modify
     * @param addresses Array of addresses to add
     */
    function add(AddressSet storage set, address[] calldata addresses) internal {
        for (uint256 i = 0; i < addresses.length; i++) {
            address addr = addresses[i];
            if (set.indices[addr] == 0) {
                set.values.push(addr);
                set.indices[addr] = set.values.length; // 1-based index
            }
        }
    }

    /**
     * @dev Add a single address to the set
     * @param set The AddressSet to modify
     * @param addr The address to add
     */
    function add(AddressSet storage set, address addr) internal {
        if (set.indices[addr] == 0) {
            set.values.push(addr);
            set.indices[addr] = set.values.length; // 1-based index
        }
    }

    /**
     * @dev Remove addresses from the set
     * @param set The AddressSet to modify
     * @param addresses Array of addresses to remove
     */
    function remove(AddressSet storage set, address[] calldata addresses) internal {
        for (uint256 i = 0; i < addresses.length; i++) {
            address addr = addresses[i];
            uint256 idx = set.indices[addr];
            if (idx != 0) {
                uint256 lastIdx = set.values.length;
                address lastAddr = set.values[lastIdx - 1];
                if (idx != lastIdx) {
                    set.values[idx - 1] = lastAddr;
                    set.indices[lastAddr] = idx;
                }
                set.values.pop();
                set.indices[addr] = 0;
            }
        }
    }

    /**
     * @dev Remove a single address from the set
     * @param set The AddressSet to modify
     * @param addr The address to remove
     */
    function remove(AddressSet storage set, address addr) internal {
        uint256 idx = set.indices[addr];
        if (idx != 0) {
            uint256 lastIdx = set.values.length;
            address lastAddr = set.values[lastIdx - 1];
            if (idx != lastIdx) {
                set.values[idx - 1] = lastAddr;
                set.indices[lastAddr] = idx;
            }
            set.values.pop();
            set.indices[addr] = 0;
        }
    }

    /**
     * @dev Clear all addresses from the set
     * @param set The AddressSet to modify
     */
    function clear(AddressSet storage set) internal {
        for (uint256 i = 0; i < set.values.length; i++) {
            set.indices[set.values[i]] = 0;
        }
        delete set.values;
    }

    /**
     * @dev Check if an address is in the set
     * @param set The AddressSet to check
     * @param addr The address to check for
     * @return true if the address is in the set
     */
    function contains(AddressSet storage set, address addr) internal view returns (bool) {
        return set.indices[addr] != 0;
    }

    /**
     * @dev Get the number of addresses in the set
     * @param set The AddressSet to check
     * @return The number of addresses in the set
     */
    function length(AddressSet storage set) internal view returns (uint256) {
        return set.values.length;
    }

    /**
     * @dev Get all addresses in the set
     * @param set The AddressSet to check
     * @return Array of all addresses in the set
     */
    function getValues(AddressSet storage set) internal view returns (address[] memory) {
        return set.values;
    }

    /**
     * @dev Get an address at a specific index
     * @param set The AddressSet to check
     * @param index The index to retrieve
     * @return The address at the given index
     */
    function at(AddressSet storage set, uint256 index) internal view returns (address) {
        require(index < set.values.length, "IterableMapping: index out of bounds");
        return set.values[index];
    }
}
